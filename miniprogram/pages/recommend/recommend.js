// pages/recommend/recommend.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    banners: null,
    homeRecommend: null,
    page_num: 1,
    loading: true,
    showBackTop: false
  },
  // 携带漫画id和名字跳转到漫画详情页
  toParticulars(event) {
    wx.navigateTo({
      url: `../particulars/particulars?id=${event.currentTarget.dataset.id}&title=${event.currentTarget.dataset.title}`,
    })
  },
  // 当滚动条距离顶部距离大于3倍页面高度是显示返回顶部按钮
  onPageScroll(res) {
    if (res.scrollTop > wx.getSystemInfoSync().windowHeight * 3) {
      this.setData({
        showBackTop: true
      })
    } else {
      this.setData({
        showBackTop: false
      })
    }
  },
  //返回顶部
  bakcTop() {
    wx.pageScrollTo({
      scrollTop: 0
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    //获取轮播图
    wx.request({
      url: 'https://apis.netstart.cn/mbcomic/Banner',
      success: (res) => {
        this.setData({
          banners: res.data.data
        })
        if (this.data.homeRecommend != null) {
          this.setData({
            loading: false
          })
        }
      },
      fail: () => {
        wx.showToast({
          icon: 'none',
          title: '加载错误',
        })
        if (this.data.homeRecommend != null) {
          this.setData({
            loading: false
          })
        }
      }
    })

    //获取推荐列表
    wx.request({
      url: 'https://apis.netstart.cn/mbcomic/HomeRecommend',
      success: (res) => {
        this.setData({
          homeRecommend: res.data.data.list
        })
        if (this.data.banners != null) {
          this.setData({
            loading: false
          })
        }
      },
      fail: () => {
        wx.showToast({
          icon: 'none',
          title: '加载错误',
        })
        if (this.data.banners != null) {
          this.setData({
            loading: false
          })
        }
      }
    })
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
    //判断列表是否大于100,是则不在加载,否则触底加载更多
    if (this.data.homeRecommend.length < 100) {
      wx.showLoading({
        title: '加载中',
      })
      this.setData({
        page_num: this.data.page_num + 1
      })
      wx.request({
        url: 'https://apis.netstart.cn/mbcomic/HomeRecommend',
        data: {
          seed: 1,
          drag: 1,
          page_num: this.data.page_num
        },
        success: (res) => {
          this.setData({
            homeRecommend: [...this.data.homeRecommend, ...res.data.data.list]
          })
          wx.hideLoading()
        },
        fail: () => {
          wx.hideLoading()
          wx.showToast({
            icon: 'none',
            title: '加载错误',
          })
        }
      })
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})