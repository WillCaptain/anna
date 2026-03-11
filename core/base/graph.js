/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {
  ALIGN,
  DOCK_MODE,
  ANNA_NAME_SPACE,
  EVENT_TYPE,
  FONT_STYLE,
  FONT_WEIGHT,
  INFO_TYPE,
  PAGE_MODE,
  PARENT_DOCK_MODE,
  PROGRESS_STATUS,
} from '../../common/const.js';
import {uuid} from '../../common/util.js';
import {nativeTextEditor} from '../text/nativeTextEditor.js';

import {page} from './page.js';
import {collaboration} from '../collaboration/collaboration.js';
import {
  addCommand, pageAddedCommand, pageIndexChangedCommand, pageRemovedCommand, transactionCommand,
} from '../history/commands.js';
import {commandHistory} from '../history/history.js';
import {countRegion} from '../interaction/hitRegion.js';
import {ENV_CONFIG} from '../../config/envConfig.js';
import ShapeCache from '../cache/shapeCache.js';
import DomCache from '../cache/domCache.js';
import DomFactory from '../cache/domFactory.js';
import {contextMenu} from '../contextToolbar/popupMenu.js';

/**
 * Graph — 整个画布文档的根管理对象
 *
 * 职责：
 *   1. 多页面生命周期管理（增删改排序、序列化/反序列化）
 *   2. 形状插件注册与工厂创建（plugins 字典 + createShape）
 *   3. DOM/Shape 缓存管理（ShapeCache、DomCache）
 *   4. 协同服务客户端持有（collaboration）
 *   5. Undo/Redo 历史管理入口（getHistory）
 *   6. 事件系统（addEventListener/fireEvent）
 *   7. 工作模式调度（edit/display/present/viewPresent）
 *
 * Graph 本身不渲染，渲染由 Page 及其 Drawer 负责。
 *
 * @param {HTMLElement} div 宿主容器 div，所有页面都在此 div 内渲染
 * @param {string} title 文档标题
 */
const graph = (div, title) => {
  // 每个 Graph 拥有全局唯一 id（UUID with timestamp prefix）
  const self = {id: uuid(true)};

  self.uuid = () => uuid();
  self.title = title || '';
  // type 字段用于序列化时区分文档类型，子类（如 defaultGraph）不应修改此值
  self.type = 'graph';
  // cookie 用于在协同消息过滤时识别"自己发出的消息"，防止回显
  self.cookie = uuid();
  self.session = {name: 'huizi', id: uuid(), time: (new Date()).toDateString()};
  // ing：正在执行异步初始化的标志，防止重复初始化
  self.ing = false;
  // ignoreHighQuality：true 时跳过高清（devicePixelRatio > 1）渲染，提升性能
  self.ignoreHighQuality = false;
  self.tenant = 'default';
  self.source = 'anna';
  div && (div.style.overflow = 'hidden');
  div && (self.cssText = div.style.cssText);
  self.div = div;
  self.tabToken = '';
  // collaborationSession：当前协同会话 id；编辑模式下等于 graph.id，演示模式下为 graphId+"_present"
  self.collaborationSession;
  self.enableSocial = true;
  // enableText：false 时禁用富文本编辑器，适用于不需要文字的纯图形场景
  self.enableText = true;
  // 方便 Shape 内部通过 parent.graph 直接访问 Graph 对象
  self.graph = self;

  //----------------------------
  /**
   * pageType 决定调用 plugins[pageType] 来创建新页面对象。
   * 子类可覆盖为自定义 page 类型名（如 'presentationPage'）。
   */
  self.pageType = 'page';

  /**
   * pages[] 存储所有页面的序列化 JSON 数据（轻量，始终常驻内存）。
   * 注意：这里是纯数据，不含运行时的 Page 对象。
   * 运行时的 Page 对象通过 pageSubscribers 维护。
   */
  self.pages = [];

  /**
   * getPages 可被子类覆盖，以实现动态页面列表（如按权限过滤）。
   */
  self.getPages = () => self.pages;

  /**
   * historyStrategy 控制 Undo/Redo 的历史栈粒度：
   *   'graph'：全局唯一历史栈（推荐，支持跨页撤销）
   *   'page' ：每页独立历史栈
   */
  self.historyStrategy = 'graph';
  self.getHistory = () => commandHistory(self.historyStrategy, self);

  // ------------------------------collaboration----------------------------------------
  /**
   * 与服务端通讯组件
   */
  self.collaboration = collaboration(self, ENV_CONFIG.collaborationUrl);
  /**
   * 注册協同能力
   */
  self.subscriptions = {};
  /**
   * 協同消息廣播
   */
  self.publish = message => {
    const subscription = self.subscriptions[message.topic];
    if (subscription === undefined) {
      return;
    }

    // 更新序列化数据
    subscription(message);

    // 更新渲染page数据
    self.syncSubscribedPage(message);
  };
  /**
   * 更新所有有显示的页面
   */
  self.syncSubscribedPage = (message, localChange) => {
    pageSubscribers.forEach(ps => {
      ps.onMessage(message, localChange);
    });
  };
  /**
   * 协作消息默认更新graph.pages里的静态数据
   * 被注册的这些page是有显示的对象数据，所以需要主动注册并改变
   */
  const pageSubscribers = [];
  self.getSubscribedPage = id => pageSubscribers.filter(p => p.id === id);
  self.getSubscribedPageByData = (id, domDiv) => pageSubscribers.find(p => (p.id === id && p.div === domDiv));
  self.subscribePage = pageObj => {
    if (pageSubscribers.contains(p => p === pageObj)) {
      return;
    }
    if (pageObj.graph !== self) {
      return;
    }
    pageSubscribers.remove(p => p.div === pageObj.div);
    pageSubscribers.push(pageObj);
  };

  self.unSubscribePage = pageObj => pageSubscribers.remove(p => p === pageObj);

  self.openCollaboration = () => {
    if (self.collaboration === undefined) {
      self.collaboration = collaboration(self, ENV_CONFIG.collaborationUrl);
    }
    self.collaboration.connect();
  };

  self.closeCollaboration = () => {
    if (self.collaboration === undefined) {
      return;
    }
    self.collaboration.close();
  };

  /**
   * 得到在綫人數消息
   * 只在activepage上处理
   * 辉子 2022
   */
  self.subscriptions['session_count'] = message => {
    const activePage = self.activePage;
    if (!activePage) {
      return;
    }
    (!activePage.sessionCountRegion) && (activePage.sessionCountRegion = countRegion(activePage));
    activePage.sessionCount = message.value;
    activePage.drawer.draw();
    self.sessionCount = activePage.sessionCount;
  };

  /**
   * 收到comment
   */
  self.subscriptions.comment = message => {
    const mPage = self.pages.find(p => p.id === message.page);
    if (mPage === undefined) {
      return;
    }
    let shape = (mPage.id === message.shape) ? mPage : (mPage.sm.getShapeById(message.shape));
    if (shape === undefined) {
      return;
    }
    if (shape.comments === undefined) {
      shape.comments = [];
    }
    shape.comments.push(message.value);
  };

  /**
   * 收到freeline的add point 命令
   */
  self.subscriptions['add_freeline_point'] = message => {
  };

  /**
   * 收到freeline的done 命令
   */
  self.subscriptions['freeline_done'] = message => {
    const mPage = self.pages.find(p => p.id === message.page);
    let free = mPage.sm.getShapeById(message.value.to);
    free.lines.push(message.value.line);
  };

  /**
   * 新增页面
   */
  self.subscriptions['page_added'] = message => {
    if (self.pages.find(p => p.id === message.page) !== undefined) {
      return;
    }
    const index = parseInt(message.value.index);
    let pageData = self.removedCache.pages.find(p => p.id === message.page);
    if (pageData === undefined) {
      pageData = message.value;
      pageData.shapes = pageData.shapes.orderBy(s => s.index).filter(s => s.container !== '');
    }
    self.insertPage(pageData, index, true);
  };

  self.ignoreCoedit = (f) => {
    self.coediteIgnored = true;
    const result = f();
    self.coediteIgnored = false;
    return result;
  };

  const invoke = self.collaboration.invoke;
  self.collaboration.invoke = async (method, args, pageId, callback) => {
    if (self.coediteIgnored) {
      return undefined;
    }
    return invoke.call(self.collaboration, method, args, pageId, callback);
  };

  // enableCache：false 时禁用 ShapeCache，每次都重新创建 Shape 对象（调试用）
  self.enableCache = true;
  // shapeCache：以 (owner, pageId, shapeId) 为 key 缓存 Shape 运行时对象，避免重复创建
  self.shapeCache = new ShapeCache();

  /**
   * 创建 Shape 的统一入口，带缓存。
   *
   * 查找顺序：
   *   1. ShapeCache 中已有缓存 → 直接复用（更新 page/container 引用）
   *   2. plugins[type] 存在 → 调用工厂函数创建
   *   3. plugins[namespace.type] 存在 → 尝试补全 namespace 后创建
   *   4. 都找不到 → 降级使用 'rectangle' 创建（防止崩溃）
   *
   * 缓存复用时需要重新设置 page/container/cachedContainer，
   * 确保切页后 Shape 的引用指向正确的 Page 对象。
   *
   * @param owner   图形 DOM 所属的根节点（pageDrawer.container div）
   * @param id      图形 id
   * @param type    图形类型（如 'rectangle' 或 'my.ns.myShape'）
   * @param x       横坐标（绝对坐标）
   * @param y       纵坐标（绝对坐标）
   * @param width   宽度
   * @param height  高度
   * @param parent  父容器对象（Page 或 Container）
   * @return {Shape} 图形对象
   */
  self.createShape = (owner, id, type, x, y, width, height, parent) => {
    let typeVal = type;
    const pageId = parent.page.id;
    let newShape = self.shapeCache.get(owner, pageId, id);
    if (!newShape) {
      if (!self.plugins[typeVal] && typeVal.split('.').length < 2) {
        typeVal = self.createShapePath(typeVal);
      }
      if (!self.plugins[typeVal]) {
        typeVal = 'rectangle';
      }
      newShape = self.plugins[typeVal](id, x, y, width, height, parent);
      // set namespace and type
      const namespaces = typeVal.split('.');
      const typeName = namespaces[namespaces.length - 1];
      newShape.type = typeName;
      if (namespaces.length > 1) {
        newShape.namespace = typeVal.substr(0, typeVal.length - typeName.length - 1);
      }
      if (self.enableCache) {
        self.shapeCache.cache(owner, pageId, newShape);
      }
    } else {
      /*
       * 设置page的原因：
       * 1、初始化一个pageA，此时shape的page是pageA
       * 2、新建一页pageB，此时graph.activePage为pageB(具体查看graph的addPage方法)
       * 3、重新切到pageA，由于shape已经存在，则进入该逻辑
       * 4、若不重新设置page，那么此时newShape的page是pageA，而不是pageB
       */
      newShape.page = parent.page;
      newShape.pageId = parent.page.id;

      /*
       * 设置容器必须在设置了page之后，否则，在disableReact为true的情况下不生效的问题，原因如下：
       * 1、被删除图形中缓存了page引用
       * 2、新建一页之后，activePage发生了变化
       * 3、撤销之后，activePage对象复用，deserialize新页面的数据
       * 4、执行command时，传入的是activePage，此时设置disableReact是设置的activePage的属性
       * 5、但是在这里设置属性判断的disableReact是shape缓存的page对象，此时page对象和activePage不是同一个对象
       * 6、因此，这里需要将属性设置放在page设置之后.
       */
      newShape.container = parent.id;

      /*
       * 设置cachedContainer的原因（以frame举例）:
       * 1、初始化一个pageA，此时frameA的page是pageA
       * 2、新建一页pageB，此时graph.activePage为pageB(具体查看graph的addPage方法)
       * 3、重新切换到pageA，由于frame已经存在，不重新创建
       * 4、由于activePage存在，此时会直接deserialize pageA的数据，
       *    而activePage的dom还是pageB的(interactiveLayer等dom还是pageB的dom)
       * 5、渲染时，由于shape的cachedContainer存在，在move时（htmlDrawer的move方法），
       *    并不会做任何处理(因为当前shape的dom父节点没有变)，所以frame及其下面的所有图形不会渲染出来
       *
       * 这里设置cachedContainer就正常的原因：
       * 这里相当于把cachedContainer设置为了pageB，而pageB的dom不是frame的dom父节点，
       * 因此会进行move()，将frame的dom添加到pageB的dom中
       */
      newShape.cachedContainer = {id: parent.id, shape: parent};
      newShape.invalidate();
    }
    return newShape;
  };

  self.domCache = new DomCache();
  self.domFactory = new DomFactory(self.domCache, self.enableCache);

  /**
   * 创建dom元素.
   *
   * @param owner 待缓存元素所属的根节点.
   * @param tagName 元素名称.
   * @param pageId 页面的id.
   * @param id dom元素的id.
   * @param ignoreExisting 是否在缓存存在的情况下也重新创建.
   * @return {*} dom对象.
   */
  self.createDom = (owner, tagName, id, pageId, ignoreExisting) => {
    return self.domFactory.create({owner, tagName, id, pageId, ignoreExisting});
  };

  /**
   * 获取缓存的dom元素.
   *
   * @param owner 待缓存元素所属的根节点.
   * @param pageId 页面id.
   * @param id 待缓存元素id.
   * @return {null|*} 若不存在，则返回null，否则返回对应元素.
   */
  self.getElement = (owner, pageId, id) => {
    return self.domCache.get(owner, pageId, id);
  };

  /**
   * 清理一页的dom元素.
   *
   * @param owner 元素所属的根节点.
   * @param pageId 页面id.
   */
  self.clearDomElements = (owner, pageId) => {
    self.domCache.clearElementsByPageId(owner, pageId);
  };

  self.setElementId = (element, id) => {
    if (!element) {
      return;
    }
    element.id = id;
  };

  self.resetElementId = (id, preId) => {
    self.domCache.forEachDom((domId, dom) => {
      if (domId === preId) {
        dom.id.replace(preId, id);
      }
    });
  };

  /**
   * 删除页面
   * 删除后其他同步页面怎么处理有待产品讨论 辉子
   */
  self.subscriptions['page_removed'] = message => {
    if (self.pages.find(p => p.id === message.page) === undefined) {
      return;
    }
    self.removePage(self.getPageIndex(message.value), true);
  };

  /**
   * 改变页面index
   */
  self.subscriptions['page_index_changed'] = message => {
    self.movePageIndex(message.value.fromIndex, message.value.toIndex, true);
  };

  /**
   * 新增一个shape
   */
  self.subscriptions['shape_added'] = message => {
    const pageData = self.pages.find(p => p.id === message.page); // get page data
    if (pageData === undefined) {
      return;
    }
    pageData.shapes.push(message.value);
  };

  /**
   * 改变shape index
   */
  self.subscriptions['shape_index_changed'] = message => {
    const pageData = self.pages.find(p => p.id === message.page); // get page data
    if (pageData === undefined) {
      return;
    }
    const shape = pageData.shapes.find(s => s.id === message.shape);
    pageData.shapes.remove(s => s.id === shape.id);
    pageData.shapes.insert(shape, message.value.toIndex);
  };

  /**
   * page内容有变化
   * 辉子 2021 update 2022
   */
  self.subscriptions['page_shape_data_changed'] = message => {
    self.ignoreCoedit(() => {
      const pageData = self.pages.find(p => p.id === message.page);
      if (pageData === undefined) {
        return;
      }

      message.value.forEach(shapeData => {
        let target = pageData.shapes.find(s => s.id === shapeData.shape || s.entangleId === shapeData.shape);

        // 如果shape没有找到，并且container不为空，说明删除的形状被恢复了,将缓存的形状加入
        if (target === undefined && shapeData.properties.container !== '' && shapeData.properties.container !== undefined) {
          target = self.removedCache.shapes.find(s => s.id === shapeData.shape);
          if (target === undefined) {
            return;
          }
          pageData.shapes.splice(target.index, 0, target);
        }

        if (!target) {
          return;
        }

        // 先更新所有字段信息
        for (let f in shapeData.properties) {
          if (!Object.prototype.hasOwnProperty.call(shapeData, f)) {
            continue;
          }
          target[f] = shapeData.properties[f];
          if (f === 'local') {
            target.needReload = true; // 无法处理shape特别的local操作，needreload表明edit,display,present时数据需要重新载入
          }
        }

        // 如果container为空，说明该shape被删除了
        if (target.container === '') {
          pageData.shapes.remove(s => s === target);

          /*
           * 如果不保护，这里会产生内存泄漏.
           * 当一个图形不停的删除撤销重做的时候，cache中的数据量会线性增大.
           */
          if (!self.removedCache.shapes.contains(s => s.id === target.id)) {
            self.removedCache.shapes.push(target);
          }

          /*
           * 复现问题场景，协同（ppt场景下）：
           * 1、在协同方1中，在第一页中添加一个矩形，然后切换到第二页
           * 2、这时在协同方2中，删除第一页中的矩形
           * 3、在协同方1中，缩略图中的图形被删除，但是切换到第一页中时，发现dom没有被删除
           * 因为dom是缓存起来的，在删除时，只调用了缩略图中的图形对象进行删除，主画布中的dom结构并没有删除，虽然在page的
           * 序列化数据中已经把图形删除掉了，但是dom并没有删除，重新编辑第一页时，dom又会跟着其parent被渲染出来
           *
           * 这里将所有未被pageSubscribers处理的图形删除事件统一处理.
           */
          self.shapeCache.forEachPage((owner, pageId, shapeMap) => {
            if (pageSubscribers.find(p => p.id === pageId && p.div === owner)) {
              return;
            }
            const shape = shapeMap.get(target.id);
            if (shape) {
              shape.invalidateAlone();
            }
          });
        }
      });
    });
  };

  /**
   * 上一页/下一页指令,presentation or display发会发出的指令
   * 辉子 2022
   */
  self.subscriptions.pageStepMoved = topic => {
    self.gotoCurrentPage(self.activePage);
  };

  self.subscriptions['graph_data_changed'] = topic => {
    self.setProperty(topic.value.field, topic.value.value, true);
  };

  // -------------------------------serilization------------------------------------

  /**
   * graph里page有增删改
   * page里的变动不触发
   * 辉子 2021
   */
  self.dirtied = (data, dirtyAction) => {
  };
  self.isDirty = () => {
    return self.activePage && self.activePage.isDirty();
  };

  /**
   * 序列化整个graph
   */
  self.serialize = () => {
    // 设置页面的顺序.
    const pages = self.pages.map(p => {
      const {shapes, ...left} = p;
      left.shapes = [...shapes];
      return left;
    });
    pages.forEach((p, index) => p.index = index);
    const serialized = {
      id: self.id,
      title: self.title,
      author: self.author,
      createTime: self.createTime,
      source: self.source,
      type: self.type,
      tenant: self.tenant,
      setting: self.setting,
      pages: pages,
      dirty: self.dirty,
      version: self.version,
      enableText: self.enableText,
      exceptionFitables: self.exceptionFitables,
    };

    // 深拷贝.
    return JSON.parse(JSON.stringify(serialized));
  };

  /**
   * 反序列化整个graph
   */
  self.deSerialize = data => {
    const cloned = JSON.parse(JSON.stringify(data));
    for (let f in cloned) {
      if (f === 'setting') {
        const setting = cloned[f];
        Object.keys(setting).forEach(s => {
          self.setting[s] = setting[s];
        });
      } else {
        self[f] = cloned[f];
      }
    }
  };

  self.pageSerialized = id => {
  };

  // ------------------------page operations-----------------------------------------
  /**
   * 手动发起调整graph里page的顺序
   * 辉子 2022
   */
  self.changePageIndex = (fromIndex, toIndex) => {
    self.movePageIndex(fromIndex, toIndex);
    pageIndexChangedCommand(self, fromIndex, toIndex);
  };

  /**
   * 手动吊证多个页面的顺序
   * @param pageIds
   * @param index（表示从这个位置开始排下去）
   */
  self.changePagesIndex = (pageIds, index) => {
    let indexVal = index;
    let commands = [];
    pageIds.forEach(id => {
      const fromIndex = self.getPageIndex(id);
      self.movePageIndex(fromIndex, indexVal);
      const command = pageIndexChangedCommand(self, fromIndex, indexVal);
      commands.push(command);
      indexVal += 1;
    });

    transactionCommand(self, commands, true).execute();
  };

  /**
   * 通过page的id调整page的顺序
   * @param id
   * @param toIndex
   */
  self.changePageIndexById = (id, toIndex) => {
    const index = self.getPageIndex(id);
    self.changePageIndex(index, toIndex);
  };

  /**
   * 调整graph里page的顺序
   * 辉子 2021
   */
  self.movePageIndex = (fromIndex, toIndex, isCoEditing) => {
    let pageObj = self.pages[fromIndex];
    moveIndex(pageObj.id, toIndex);
    if (!isCoEditing) {
      self.collaboration.invoke({
        method: 'change_page_index', page: pageObj.id, value: {fromIndex, toIndex},
      });
    }
  };

  /**
   * 手动删除一页
   * 辉子 2022
   */
  self.deletePage = index => {
    const pageObj = self.pages[index];
    self.removePage(index);
    pageRemovedCommand(self, pageObj, index);
  };

  /**
   * 手动批量删除多页
   * @param pageIds
   */
  self.deletePages = pageIds => {
    let commands = [];
    pageIds.forEach(id => {
      const index = self.getPageIndex(id);
      const p = self.pages[index];
      self.removePage(index);
      const command = pageRemovedCommand(self, p, index);
      commands.push(command);
    });
    transactionCommand(self, commands, true).execute();
  };

  /**
   * 手动新增一页
   */
  self.addPage = (name, id, targetDiv, index, data, mode = PAGE_MODE.CONFIGURATION) => {
    let indexVal = index;
    const pageObj = self.ignoreCoedit(() => {
      const p = self.newPage(targetDiv, mode, name, id);
      if (data) {
        Object.keys(data).forEach(f => {
          p[f] = data[f];
        });
      }
      return p;
    });
    self.activePage = pageObj;
    const pageData = pageObj.serialize();
    indexVal = self.insertPage(pageData, indexVal);
    pageAddedCommand(self, pageData, indexVal); // create history command
    return pageObj;
  };

  /**
   * removedCache 是协同 Undo 的恢复缓存。
   * 在协同场景下，远端删除的 page/shape 本地不会立即清除 DOM，
   * 而是保存到此缓存，当收到"恢复"消息（container 非空）时从缓存还原，
   * 防止需要网络重新拉取数据。注意：缓存有重复保护，防止内存泄漏。
   */
  self.removedCache = {pages: [], shapes: []};

  /**
   * graph中删除一 page
   */
  self.removePage = (index, isCoEditing) => {
    const pageObj = self.pages[index];
    self.pages.splice(index, 1);
    if (!self.removedCache.pages.contains(p => p.id === pageObj.id)) {
      self.removedCache.pages.push(pageObj);
    }

    // @maliya 如果移除的页面 同时也是选中的页面，则选中页面也需要清空
    if (pageObj.id === self.activePage.id) {
      self.activePage.expired = true;
    }

    if (self.pageRemoved) {
      self.pageRemoved(pageObj, index);
    }
    if (!isCoEditing) {
      self.collaboration.invoke({method: 'remove_page', page: pageObj.id, value: pageObj.id});
    }
    self.dirtied(self.serialize(), {page: pageObj.id, action: 'page_removed', session: self.session});

    // 删除页面时 需要清除订阅
    const ps = self.getSubscribedPage(pageObj.id);
    ps.forEach(p => self.unSubscribePage(p));
  };

  /**
   * 把孤立的page加入到graph中
   * 辉子 2022
   */
  self.insertPage = (pageObj, index, isCoEditing) => {
    // page列表中如果没有该page，则加入该page
    if (!self.pages.contains(p => p.id === pageObj.id)) {
      self.pages.push(pageObj);
    }
    if (index !== undefined && index !== self.pages.length) {
      moveIndex(pageObj.id, index);
    }
    let idx = index;
    if (idx === undefined) {
      idx = self.pages.length - 1;
    }
    if (self.pageAdded) {
      self.pageAdded(pageObj, idx);
    }
    if (!isCoEditing) {
      const serialized = {};
      serialized.index = idx;
      for (let f in pageObj) {
        if (Object.prototype.hasOwnProperty.call(pageObj, f)) {
          serialized[f] = pageObj[f];
        }
      }
      serialized.index = idx;
      self.collaboration.invoke({method: 'new_page', page: pageObj.id, value: serialized});
    }
    self.dirtied(self.serialize(), {page: pageObj.id, action: 'page_added', session: self.session});
    return idx;
  };

  /**
   * create a new page object. page is not listed in graph.pages
   * 通过newPage得到的page未必属于graph，也可以是（编辑，演示）用来承载graph.pages的对象，所以在newPage里不能serialize，否则会为graph新增一页
   * 辉子 2022
   */
  self.newPage = (targetDiv, mode = PAGE_MODE.CONFIGURATION, name = '--', id, isEmpty) => {
    let targetDivVal = targetDiv;
    if (targetDivVal === undefined) {
      targetDivVal = self.div;
      targetDivVal.style.cssText = self.cssText;
    }

    self.newPageMode = mode;
    let newPage = self.plugins[self.pageType](targetDivVal, self, name, id);
    delete self.newPageMode;
    newPage.serialized = data => {
      const idx = self.pages.findIndex(p => p.id === data.id);
      if (idx === -1) {
        self.pages.push(data);
      }
      self.pageSerialized(data.id);
    };

    // 未传id时，才执行initialize方法.
    if (!id && !isEmpty) {
      newPage.initialize();
    }
    newPage.load();
    newPage.active();
    if (!self.activePage || self.activePage.expired) {
      self.activePage = newPage;
    }
    self.subscribePage(newPage);
    return newPage;
  };

  self.removePageById = id => {
    const index = self.getPageIndex(id);
    self.removePage(index);
  };

  /**
   * 通过page在该graph中的index，得到某page数据
   * 留待覆盖，为得到最新数据，可以判断page.isDirty确定是否从persistence得到最新数据
   * 辉子 2021
   */
  self.getPageData = index => self.pages[index === undefined ? 0 : index];

  /**
   * 通过page.id得到某page数据
   * @param {*} id
   */
  self.getPageDataById = id => self.pages.find(p => p.id === id);
  /**
   * 得到页面数量
   * 辉子 2021
   */
  self.getPagesNumber = () => self.pages.length;
  /**
   * 得到某页面在本graph的index
   * 辉子 2021
   */
  self.getPageIndex = pageId => self.pages.map(p => p.id).indexOf(pageId);

  /**
   * 如果没有active的page，默认是configuration
   * @returns {string}
   */
  self.getMode = () => {
    return !self.activePage ? PAGE_MODE.CONFIGURATION : self.activePage.mode;
  };

  /**
   * start edit mode
   */
  self.edit = async (index, domDiv, id) => {
    let pageObj = self.newPage(domDiv, PAGE_MODE.CONFIGURATION, undefined, id, true);
    await pageObj.take(self.getPageData(index));
    return pageObj;
  };

  /**
   * start runtime display mode
   */
  self.display = async (id, divDom) => {
    let pageObj = self.getSubscribedPageByData(id, divDom);
    const index = self.getPageIndex(id);
    const data = self.getPageData(index);
    !pageObj && (pageObj = self.newPage(divDom, PAGE_MODE.DISPLAY, undefined, id, true));
    await pageObj.take(data);
  };

  /**
   * start presentation mode
   * 辉子 2021
   */
  self.present = async (index, divDom) => {
    self.collaboration.mute = false;
    const pageData = self.getPageData(index);
    const pageObj = self.newPage(divDom, PAGE_MODE.PRESENTATION, undefined, pageData.id, true);
    await pageObj.take(pageData, p => {
      self.collaboration.invoke({method: 'move_page_step', page: p.id, value: p.animationIndex});
    });
    return pageObj;
  };

  /**
   * 如果觀察者沒能得到數據，則觸發该方法
   * 辉子 2021
   */
  self.viewPresentFail = () => {
  };

  /**
   * 观看模式
   * 辉子 2021
   */
  self.viewPresent = (divDom) => {
    if (self.activePage) {
      self.activePage.close();
    }
    self.activePage = null;
    self.collaboration.mute = true;
    self.newPage(divDom, PAGE_MODE.VIEW);
    self.collaboration.mute = false;
    const result = {then: f => result.presented = f};
    self.gotoCurrentPage(self.activePage, result.presented);
    return result;
  };

  /**
   * 得到所有页面简要信息
   * 可根据实际应用扩展
   * 辉子 2021
   */
  self.getPagesBrief = () => {
    let pages = [];
    self.pages.forEach((p, i) => {
      let pageData = {};
      pageData.id = p.id;
      pageData.index = i;
      pageData.isTemplate = p.isTemplate;
      pages.push(pageData);
    });
    return pages;
  };

  /**
   * 主动跳到当前演示的位置
   * 辉子 2021
   */
  self.gotoCurrentPage = (pageObj, presented) => {
    self.collaboration.invoke({method: 'get_present_page_index', value: self.collaborationSession}, position => {
      const pageIndex = self.getPageIndex(position.page);
      if (pageObj.id === position.page) {
        if (pageIndex === -1 || self.getPageData(pageIndex).isTerminal) {
          pageObj.cancelFullScreen();
        } else {
          if (presented) {
            presented(pageObj, position);
          }
        }
      } else {
        if (pageIndex === -1) {
          return;
        }

        pageObj.take(self.getPageDataById(position.page), () => {
          if (presented) {
            presented(pageObj, position);
          }
        });
      }
    });
  };

  /**
   * 取消全屏时触发.
   */
  self.fullScreenCancelled = () => {
  };

  /**
   * prsentation 模式下得到下一页数据
   * graph.pages在初始化时就有所有page的数据
   * 辉子 2021
   */
  self.getNextPage = (previousPageId, condition = p => true) => {
    let idx = self.getPageIndex(previousPageId);
    if (idx >= self.getPagesNumber() - 1) {
      return undefined;
    }
    let data = self.getPageData(idx + 1);
    if (!data) {
      return undefined;
    }
    if (condition(data)) {
      return data;
    }
    return self.getNextPage(data.id, condition);
  };

  /**
   * presentation模式下得到上一页数据
   * 其他同上
   * 辉子 2021
   */
  self.getPreviousPage = (nextPageId, condition = p => true) => {
    let idx = self.getPageIndex(nextPageId);
    if (idx <= 0) {
      return undefined;
    }
    let data = self.getPageData(idx - 1);
    if (condition(data)) {
      return data;
    }
    return self.getPreviousPage(data.id, condition);
  };

  /**
   * 切page的层
   */
  const moveIndex = (pageId, index) => {
    let data = self.pages.find(p => p.id === pageId);
    if (data === undefined) {
      return;
    }
    self.pages.remove(p => p.id === pageId);
    self.pages.insert(data, index);
    self.dirtied(self.serialize(), {page: pageId, action: 'page_index_changed', session: self.session});
  };

  /**
   * setting 是全局默认样式表，所有 Shape 未显式设置的属性会从这里继承。
   * 子类或宿主应用可通过修改 graph.setting.xxx 来改变全局默认外观。
   * 详见文件末尾的 defaultSetting 对象。
   */
  self.setting = defaultSetting;

  /**
   * get system setting from text
   */
  self.importSetting = settingString => self.setting = eval(settingString);

  /**
   * plugins 是形状类型注册表，key 为类型字符串（如 'rectangle' 或 'ns.type'），
   * value 为工厂函数：(id, x, y, w, h, parent) => Shape。
   * 内置形状通过 initialize() 的 staticImport 链式调用注册，
   * 插件形状通过 import(url) 或 dynamicImport(url) 动态注册。
   * page 类型默认预置，因为 Graph 在 newPage 时立即需要它。
   */
  self.plugins = {page: page};

  self.auxiliaryToolConfig = auxiliaryToolConfig;

  self.login = account => {
    if (!account) {
      return;
    }
    self.session = account;
  };

  /**
   * 预加载所有内置核心形状插件。
   * 使用 webpack eager 模式确保这些模块在构建时被打包，不走网络请求。
   * 返回 staticImport 构建器，可链式调用 .staticImport() 继续追加，
   * 或调用 .import(url) 在内置形状加载完成后继续加载外部插件。
   */
  self.initialize = () => {
    if (self.loadConfig) {
      self.loadConfig();
    }
    return self.staticImport(() => import('../interaction/connector.js'))
      .staticImport(() => import('./container.js'))
      .staticImport(() => import('../shapes/ellipse.js'))
      .staticImport(() => import('../shapes/others.js'))
      .staticImport(() => import('../shapes/group.js'))
      .staticImport(() => import('../shapes/icon.js'))
      .staticImport(() => import('../shapes/image.js'))
      .staticImport(() => import('../shapes/line.js'))
      .staticImport(() => import('../shapes/rectangle.js'))
      .staticImport(() => import('../shapes/reference.js'))
      .staticImport(() => import('../shapes/svg.js'))
      .staticImport(() => import('../shapes/vector.js'))
      .staticImport(() => import('../shapes/media/video.js'))
      .staticImport(() => import('../shapes/geometry/triangle.js'))
      .staticImport(() => import('../shapes/arrows/rightArrow.js'))
      .staticImport(() => import('../shapes/arrows/bottomArrow.js'))
      .staticImport(() => import('../shapes/arrows/dovetailArrow.js'))
      .staticImport(() => import('../shapes/geometry/parallelogram.js'))
      .staticImport(() => import('../shapes/geometry/diamond.js'))
      .staticImport(() => import('../shapes/geometry/regularPentagonal.js'))
      .staticImport(() => import('../shapes/geometry/pentagram.js'))
      .staticImport(() => import('../shapes/arrows/leftAndRightArrow.js'))
      .staticImport(() => import('../shapes/arrows/rightCurlyBrace.js'))
      .staticImport(() => import('../shapes/geometry/roundedRectangleCallout.js'))
      .staticImport(() => import('../shapes/freeLine.js'))
      ;
  };

  self.staticImport = (importStatementFunc, definedShapeArray, next) => {
    let nextVal = next;
    let createStaticBuilder = () => {
      const builder = createBuilder();
      builder.staticImport = (importStatement, definedShapes) => {
        builder.importStatement = importStatement;
        builder.definedShapes = definedShapes;
        builder.next = createStaticBuilder();
        return builder.next;
      };
      return builder;
    };
    (!nextVal) && (nextVal = createStaticBuilder()) && (nextVal.definedShapes = definedShapeArray); // add first defined shapes huizi 2023
    importStatementFunc().then(shapes => {
      setShapes(shapes);
      if (nextVal.callback) {
        nextVal.callback();
      }
      if (nextVal.importStatement) {
        self.staticImport(nextVal.importStatement, nextVal.definedShapes, nextVal.next);
      }
      if (nextVal.address) {
        self.import(nextVal.address, nextVal.definedShapes, nextVal.next);
      }
    });
    return nextVal;
  };

  const createBuilder = () => {
    const builder = {};
    builder.then = callback => builder.callback = callback;
    builder.import = (address, definedShapes) => {
      builder.address = address;
      builder.definedShapes = definedShapes;
      builder.next = createBuilder();
      return builder.next;
    };
    return builder;
  };

  const setShapes = (shapes, definedShapes = undefined) => {
    const namespace = shapes.namespace; // 看是否有namespace huizi 2023
    if (definedShapes === undefined) { // 没有指定载入的shapes，默认载入所有export的变量
      for (let shape in shapes) {
        if (shape === 'namespace') {
          continue;
        }
        if (namespace) {
          self.plugins[`${namespace}.${shape}`] = shapes[shape];
        } else {
          self.plugins[shape] = shapes[shape]; // 有待优化，只保留对shape的引用，而不是所有export的变量
        }
      }
    } else {
      definedShapes.forEach(s => self.plugins[s] = shapes[s]);
    }
  };

  self.createShapePath = (type, namespace = ANNA_NAME_SPACE) => {
    return `${namespace}.${type}`;
  };

  /**
   * import plugin shapes
   * 辉子 2021
   */
  self.import = (address, definedShapes, next) => {
    let nextVal = next;
    (!nextVal) && (nextVal = createBuilder());
    import(/* webpackIgnore: true */ address).then(shapes => {
      setShapes(shapes, definedShapes);
      if (nextVal.callback) {
        nextVal.callback();
      }
      if (nextVal.address) {
        self.import(nextVal.address, nextVal.definedShapes, nextVal.next);
      }
    });
    return nextVal;
  };

  self.dynamicImport = async address => {
    const shapes = await import(/* webpackIgnore: true */ address);
    setShapes(shapes);
  };

  self.dynamicImportStatement = async (importStatement) => {
    const shapes = await importStatement();
    setShapes(shapes);
  };

  let eventHandlers = {};

  self.fireEvent = async (event) => {
    const handlers = eventHandlers[event.type];
    if (handlers) {
      for (let i = 0; i < handlers.length; i++) {
        const handler = handlers[i];
        await handler(event.value);
      }
    }
  };

  /**
   * 添加事件监听器.
   *
   * @param type 事件类型.
   * @param handler 事件监听器.
   */
  self.addEventListener = (type, handler) => {
    !eventHandlers[type] && (eventHandlers[type] = []);
    eventHandlers[type].push(handler);
  };

  /**
   * 移除事件监听器.
   *
   * @param type 事件类型.
   * @param handler 事件监听器.
   */
  self.removeEventListener = (type, handler) => {
    const handlers = eventHandlers[type];
    if (!handlers || handlers.length === 0) {
      return;
    }
    const index = handlers.findIndex(h => h === handler);
    handlers.splice(index, 1);
  };

  // -------------graph data change collaboration------------------------huizi 2022.07.10
  self.setProperty = (field, value, isCoEditing) => {
    if (self[field] !== undefined) {
      self[field] = value;
    } else {
      if (self.setting[field] !== undefined) {
        self.setting[field] = value;
      } else {
        return;
      }
    }
    if (!isCoEditing) {
      self.collaboration.invoke({method: 'change_graph_data', value: {field, value}});
    }
  };

  /**
   * 创建原生文字编辑器（基于 contenteditable）。
   * 子类可以覆盖此方法以接入外部富文本引擎。
   *
   * @param {object} shape 图形对象
   * @returns {object} 编辑器接口
   */
  self.createEditor = (shape) => {
    const editor = nativeTextEditor(shape);
    // 将 input 事件触发的文字变更同步回 shape.text
    const listenerId = `${shape.page?.id ?? ''}_${shape.id}`;
    editor.editor.addDataListener(listenerId, (prevData, data, isSetManually) => {
      if (isSetManually) return;
      shape.page?.ignoreReact(() => {
        if (shape.text !== data) {
          shape.text = data;
        }
        shape.textChanged?.();
        if (shape.isEnableHtmlText?.()) {
          shape.textInnerHtml = data;
        }
      });
    });
    return editor;
  };

  /**
   * 所有对 Graph/Page/Shape 数据的外部修改都应通过此方法执行。
   * 调用前会重置历史批次号，确保本次 operation 内产生的所有 Command 属于同一批次，
   * 从而在 Ctrl+Z 时作为一个整体被撤销。
   *
   * @param {function} operation 操作函数，内部调用 annaWriter 的各方法
   */
  self.change = (operation) => {
    if (typeof operation !== 'function') {
      throw new Error('operation must be a function.');
    }
    self.getHistory().clearBatchNo();
    operation();
  };

  self.loadConfig = () => {
    self.contextMenu = {};
    self.contextMenu.shape = [{
      text: shape => '删除',
      action: shapes => shapes.forEach(s => s.remove()),
      draw: (context) => {
        context.fillStyle = 'red';
        context.fillRect(-2, -2, 12, 12);
      },
    }];
  };

  /**
   * 当需要销毁graph对象时调用
   */
  self.destroy = () => {
    if (self.activePage) {
      self.activePage.clear();
    }
  };

  builtInListeners(self);
  return self;
};

/**
 * 添加graph中默认的事件监听事件.
 *
 * @param g graph对象.
 */
const builtInListeners = (g) => {
  // 监听contextMenu事件，统一处理followBar创建.
  g.addEventListener(EVENT_TYPE.CONTEXT_CREATE, shapes => {
    if (g.activePage.contextToolbar) {
      g.activePage.contextToolbar.destroy();
    }
    if (g.activePage.showContextMenu()) {
      contextMenu(g.activePage, g.activePage.getFocusedShapes());
    }
  });

  // 统一处理图形添加的事件，创建图形添加的command
  g.addEventListener(EVENT_TYPE.SHAPE_ADDED, shapes => {
    let commandShapes = [];
    shapes.map(s => commandShapes.push({shape: s}));
    addCommand(g.activePage, commandShapes);
  });
};

/**
 * default setting from graph
 */
const defaultSetting = {
  borderColor: 'steelblue',
  backColor: 'whitesmoke',
  headColor: 'steelblue',
  fontColor: 'steelblue',
  captionfontColor: 'whitesmoke',
  fontFace: 'arial',
  captionfontFace: 'arial black',
  fontSize: 12,
  captionfontSize: 14,
  fontStyle: FONT_STYLE.NORMAL,
  captionfontStyle: FONT_STYLE.NORMAL,
  fontWeight: FONT_WEIGHT.LIGHTER,
  captionfontWeight: FONT_WEIGHT.LIGHTER,
  hAlign: ALIGN.MIDDLE,
  vAlign: ALIGN.TOP,
  captionhAlign: ALIGN.MIDDLE,
  lineHeight: 1.5,
  lineWidth: 2,
  captionlineHeight: 1,
  focusMargin: 0,
  focusBorderColor: 'darkorange',
  focusFontColor: 'darkorange',
  focusBackColor: 'whitesmoke',
  mouseInColor: 'orange',
  mouseInBorderColor: 'orange',
  mouseInFontColor: 'orange',
  mouseInBackColor: 'whitesmoke',
  borderWidth: 1,
  focusBorderWidth: 1,
  globalAlpha: 1,
  backAlpha: 0.15,
  cornerRadius: 4,
  dashWidth: 0,
  autoText: false,
  autoHeight: false,
  autoWidth: false,
  margin: 25,
  pad: 10,
  code: '',
  rotateDegree: 0,
  shadow: '',
  focusShadow: '',
  shadowData: '2px 2px 4px',
  outstanding: false,
  pDock: PARENT_DOCK_MODE.NONE,
  dockMode: DOCK_MODE.NONE,
  priority: 0,
  infoType: INFO_TYPE.NONE,
  progressStatus: PROGRESS_STATUS.NONE,
  progressPercent: 0.65,
  showedProgress: false,
  itemPad: [5, 5, 5, 5],
  itemScroll: {x: 0, y: 0},
  scrollLock: {x: false, y: false},
  resizeable: true,
  selectable: true,
  rotateAble: true,
  editable: true,
  moveable: true,
  dragable: true,
  visible: true,
  deletable: true,
  allowLink: true, // 允许line链接
  shared: false, // 是否被不同的page引用
  strikethrough: false,
  underline: false,
  numberedList: false,
  bulletedList: false,
  enableAnimation: false,
  enableSocial: true,
  emphasized: false,
  bulletSpeed: 1,
  tag: {}, // 其他任何信息都可以序列化后放在这里
};

const auxiliaryToolConfig = {
  enableGuides: false, // 开启智能参考线
};

export {graph};
