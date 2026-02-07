const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')

var sliderWidth = 96; // 需要设置slider的宽度，用于计算中间位置
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabs: ['推荐', '单板', '双板', '滑板','冰球'],
    activeIndex: 0,
    imgUrls: [
      "cloud://huqq-4grafodl1eec3739.6875-huqq-4grafodl1eec3739-1304293882/1.jpg",
    ],
    showPwdPop: false,
    loadingHidden: false, // loading
    selectCurrent: 0,
    activeCategoryId: 0,
    goods: [],
    scrollTop: 0,
    loadingMoreHidden: true,
    curPage: 1,
    pageSize: 20,
    cateScrollTop: 0,
    page: 1, // 读取第几页数据，便于实现下滑分页
    articleList: [], // 文章列表
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
    this.xuechang()
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

  bindinput(e) {
    this.setData({
      inputVal: e.detail.value
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
  bindconfirm(e) {
    this.setData({
      inputVal: e.detail.value
    })
  },
  async xuechang () {
    // 读取分类详情
    const categoryInfo = await WXAPI.cmsCategoryDetail(69014);
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
    this.fetchArticles(69014);
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
})