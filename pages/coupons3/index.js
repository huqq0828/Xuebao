const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')

var sliderWidth = 96; // 需要设置slider的宽度，用于计算中间位置
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabs: ['推荐', '商城', '雪场', '教练','活动'],
    activeIndex: 0,
    imgUrls: [
      "cloud://huqq-4grafodl1eec3739.6875-huqq-4grafodl1eec3739-1304293882/1.jpg",
    ],
    showPwdPop: false,
    loadingHidden: false, // loading
    selectCurrent: 0,
    categories: [],
    activeCategoryId: 0,
    goods: [],
    scrollTop: 0,
    loadingMoreHidden: true,
    curPage: 1,
    pageSize: 20,
    cateScrollTop: 0,
    page: 1, // 读取第几页数据，便于实现下滑分页
    articleList: [], // 文章列表
    articleList3: [], // 文章列表
    articleList2: [] // 文章列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(e) {
    wx.showShareMenu({
      withShareTicket: true
    })    
    const that = this
    if (e && e.scene) {
      const scene = decodeURIComponent(e.scene)
      if (scene) {        
        wx.setStorageSync('referrer', scene.substring(11))
      }
    }
    wx.setNavigationBarTitle({
      title: wx.getStorageSync('mallName')
    })
    this.initBanners()
    this.categories()
    this.xuechang()
    this.xuechang2()
    this.xuechang3()
    WXAPI.goods({
      recommendStatus: 1
    }).then(res => {
      if (res.code === 0){
        that.setData({
          goodsRecommend: res.data
        })
      }      
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if (this.data.activeIndex == 0) {
      this.sysCoupons()
    }
    AUTH.checkHasLogined().then(isLogined => {
      this.setData({
        isLogined
      })
      if (isLogined) {
        if (this.data.activeIndex == 1) {
          this.getMyCoupons()
        }
        if (this.data.activeIndex == 2) {
          this.invalidCoupons()
        }
      }
    })
  },
  onReachBottom: function () {
    
  },
  tabClick: function (e) {
    this.setData({
      activeIndex: e.detail.index
    });
    if (this.data.activeIndex == 0) {
      this.sysCoupons()
    }
    if (this.data.activeIndex == 1) {
      this.getMyCoupons()
    }
    if (this.data.activeIndex == 2) {
      this.invalidCoupons()
    }
  },
  filter(e){
    this.setData({
      orderBy: e.currentTarget.dataset.val
    })
    this.search()
  },
  toDetailsTap: function(e) {
    wx.navigateTo({
      url: "/pages/goods-details/index?id=" + e.currentTarget.dataset.id
    })
  },
  async initBanners(){
    const _data = {}
    // 读取头部轮播图
    const res1 = await WXAPI.banners({
      type: 'index'
    })
    if (res1.code == 700) {
      wx.showModal({
        title: '提示',
        content: '请在后台添加 banner 轮播图片，自定义类型填写 index',
        showCancel: false
      })
    } else {
      _data.banners = res1.data
    }
    this.setData(_data)
  },
  async getGoodsList(categoryId, append) {
    if (categoryId == 0) {
      categoryId =  222659;
    }
    wx.showLoading({
      "mask": true
    })
    const res = await WXAPI.goods({
      categoryId: categoryId,
      page: this.data.curPage,
      pageSize: this.data.pageSize
    })
    wx.hideLoading()
    if (res.code == 404 || res.code == 700) {
      let newData = {
        loadingMoreHidden: false
      }
      if (!append) {
        newData.goods = []
      }
      this.setData(newData);
      return
    }
    let goods = [];
    if (append) {
      goods = this.data.goods
    }
    for (var i = 0; i < res.data.length; i++) {
      goods.push(res.data[i]);
    }
    this.setData({
      loadingMoreHidden: true,
      goods: goods,
    });
    this.data.goodsId = goods.id
    let goodsDetailSkuShowType = wx.getStorageSync('goodsDetailSkuShowType')
    this.setData({
      goodsDetailSkuShowType,
    })
  },
  async categories(){
    const res = await WXAPI.goodsCategory()
    let categories = [];
    if (res.code == 0) {
      const _categories = res.data.filter(ele => {
        return ele.level == 1
      })
      categories = categories.concat(_categories)
    }
    this.setData({
      categories: categories,
      activeCategoryId: 0,
      curPage: 1
    });
    this.getGoodsList(0);
  },
  onReachBottom: function() {
    this.setData({
      curPage: this.data.curPage + 1
    });
    this.getGoodsList(this.data.activeCategoryId, true)
  },
  bindinput(e) {
    this.setData({
      inputVal: e.detail.value
    })
  },
  bindconfirm(e) {
    this.setData({
      inputVal: e.detail.value
    })
    wx.navigateTo({
      url: '/pages/goods/list?name=' + this.data.inputVal,
    })
  },
  onPageScroll(e) {
    let scrollTop = this.data.scrollTop
    this.setData({
      scrollTop: e.scrollTop
    })
  },
  filter(e){
    this.setData({
      orderBy: e.currentTarget.dataset.val
    })
    this.search()
  },

  async xuechang () {
    // 读取分类详情
    const categoryInfo = await WXAPI.cmsCategoryDetail(68932);
    if (categoryInfo.code != 0) {
      wx.showModal({
        title: '提示',
        content: '当前分类不存在',
        showCancel: false,
        confirmText: '返回',
        success(res) {
          wx.navigateBack()
        }
      })
      return;
    }  
    this.setData({
      categoryInfo: categoryInfo.data
    });
    // 读取分类下的文章
    this.fetchArticles(68932);
  },  
  async xuechang2 () {
    // 读取分类详情
    const categoryInfo = await WXAPI.cmsCategoryDetail(68942);
    if (categoryInfo.code != 0) {
      wx.showModal({
        title: '提示',
        content: '当前分类不存在',
        showCancel: false,
        confirmText: '返回',
        success(res) {
          wx.navigateBack()
        }
      })
      return;
    }  
    this.setData({
      categoryInfo: categoryInfo.data
    });
    // 读取分类下的文章
    this.fetchArticles2(68942);
  },
  async xuechang3 () {
    // 读取分类详情
    const categoryInfo = await WXAPI.cmsCategoryDetail(68975);
    if (categoryInfo.code != 0) {
      wx.showModal({
        title: '提示',
        content: '当前分类不存在',
        showCancel: false,
        confirmText: '返回',
        success(res) {
          wx.navigateBack()
        }
      })
      return;
    }  
    this.setData({
      categoryInfo: categoryInfo.data
    });
    // 读取分类下的文章
    this.fetchArticles3(68975);
  },
  async fetchArticles (pid) {
    const response = await WXAPI.cmsArticles({
      page: this.data.page,
      categoryId: pid
    });
    if (response.code == 0) {
      this.setData({
        articleList: this.data.articleList.concat(response.data)
      });
    }
  },
  async fetchArticles2 (pid) {
    const response = await WXAPI.cmsArticles({
      page: this.data.page,
      categoryId: pid
    });
    if (response.code == 0) {
      this.setData({
        articleList2: this.data.articleList2.concat(response.data)
      });
    }
  },
  async fetchArticles3 (pid) {
    const response = await WXAPI.cmsArticles({
      page: this.data.page,
      categoryId: pid
    });
    if (response.code == 0) {
      this.setData({
        articleList3: this.data.articleList3.concat(response.data)
      });
    }
  },
})