// pages/classify/classify.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    all_label: null,
    list: [],
    style_id: -1,
    area_id: -1,
    is_finish: -1,
    is_free: -1,
    order: 0,
    page_num: 1,
    is_show: false,
    loading: true,
    showBackTop:false
  },
  //获取内容列表
  getList() {
    wx.request({
      url: 'https://apis.netstart.cn/mbcomic/ClassPage',
      data: {
        style_id: this.data.style_id,
        area_id: this.data.area_id,
        is_finish: this.data.is_finish,
        is_free: this.data.is_free,
        order: this.data.order,
        page_num: this.data.page_num,
        page_size: 15
      },
      success: (res) => {
        this.setData({
          list: [...this.data.list, ...res.data.data]
        })
        if (this.data.all_label != null) {
          this.setData({
            loading: false
          })
          wx.hideLoading()
        }
      },
      fail: () => {
        // 提示加载错误
        this.setData({
          page_num: this.data.page_num - 1
        })
        wx.showToast({
          icon: 'none',
          title: '加载错误',
        })
        wx.hideLoading()
      }
    })
  },
  //修改分类
  changeStyleId(event) {
    wx.showLoading({
      title: '加载中'
    })
    this.setData({
      list: [],
      style_id: event.target.dataset.style_id
    })
    this.getList()
  },
  changeAreaId(event) {
    wx.showLoading({
      title: '加载中',
    })
    this.setData({
      list: [],
      area_id: event.target.dataset.area_id
    })
    this.getList()
  },
  changeIsFinish(event) {
    wx.showLoading({
      title: '加载中',
    })
    this.setData({
      list: [],
      is_finish: event.target.dataset.is_finish
    })
    this.getList()
  },
  changeIsFree(event) {
    wx.showLoading({
      title: '加载中',
    })
    this.setData({
      list: [],
      is_free: event.target.dataset.is_free
    })
    this.getList()
  },
  changeOrder(event) {
    wx.showLoading({
      title: '加载中',
    })
    this.setData({
      list: [],
      order: event.target.dataset.order
    })
    this.getList()
  },
  //显示/隐藏更多分类
  changIsShow() {
    this.setData({
      is_show: !this.data.is_show
    })
  },
  // 携带漫画id和名字跳转到漫画详情页
  toParticulars(event) {
    wx.navigateTo({
      url: `../particulars/particulars?id=${event.currentTarget.dataset.season_id}&title=${event.currentTarget.dataset.title}`,
    })
  },
  // 当滚动条距离顶部距离大于3倍页面高度是显示返回顶部按钮
  onPageScroll(res) {
    if(res.scrollTop>wx.getSystemInfoSync().windowHeight*3){
      this.setData({
        showBackTop:true
      })
    }else{
        this.setData({
          showBackTop:false
        })
    }
  },
  //返回顶部
  bakcTop(){
    wx.pageScrollTo({
      scrollTop: 0
     })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    //获取分类列表
    wx.request({
      url: 'https://apis.netstart.cn/mbcomic/AllLabel',
      success: (res) => {
        this.setData({
          all_label: res.data.data
        })
        //隐藏loading
        if (this.data.list.length > 0) {
          this.setData({
            loading: false
          })
          wx.hideLoading()
        }
      },
      fail: () => {
        wx.showToast({
          icon: 'none',
          title: '加载错误',
        })
        wx.hideLoading()
      }
    })
    //获取内容列表
    this.getList()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    //触底加载更多
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    this.setData({
      page_num: this.data.page_num + 1
    })
    this.getList()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})