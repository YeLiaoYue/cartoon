// pages/rank/rank.js
const db = wx.cloud.database()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    rank: null,
    type: 3,
    loading: true,
    showBackTop:false
  },
  //根据type获取排行榜内容
  getRank() {
    wx.request({
      url: `https://apis.netstart.cn/mbcomic/HomeHot?type=${this.data.type}`,
      success: (res) => {
        this.setData({
          rank: res.data.data,
          loading: false
        })
        db.collection('rank').add({
          data: {
            _id: this.data.type,
            rank: res.data.data
          },
          success:(result)=>{}
        })
        db.collection('rank').doc(this.data.type).update({
          data: {
            rank: res.data.data
          },
          success:(result)=>{}
        })
        wx.hideLoading()
      },
      fail:()=>{
        db.collection('rank').where({
          _id:this.data.type
        }).get({
          success:(result)=>{
            if(result.data.length>0){
              this.setData({
                rank:result.data[0].rank
              })
            }else{
              wx.showToast({
                icon: 'none',
                title: '加载错误',
              })
            }
          }
        })
      }
    })
  },
  //修改排行榜类型
  changeType(event) {
    wx.showLoading({
      title: '加载中',
    })
    this.setData({
      type: event.target.dataset.num
    })
    this.getRank()
  },
  // 携带漫画的id和名字跳转到漫画详情页
  toParticulars(event) {
    wx.navigateTo({
      url: `../particulars/particulars?id=${event.currentTarget.dataset.id}&title=${event.currentTarget.dataset.title}`,
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
    //获取排行榜内容
    this.getRank()
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

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})