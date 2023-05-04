// pages/read/read.js
const db = wx.cloud.database()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    content: [],
    showContent: [],
    imgList: [],
    i: 0,
    ep_list: null,
    currentIndex: 0,
    ep_id: null,
    showImgIndex: 1,
    imgListHeight: {}
  },
  //获取图片链接和token
  getImgList() {
    wx.request({
      url: 'https://apis.netstart.cn/mbcomic/ImageToken',
      data: {
        urls: JSON.stringify(this.data.showContent[(this.data.i)].map(item => item.path + '@660w.jpg'))
      },
      success: (res) => {
        this.setData({
          imgList: [...this.data.imgList, ...res.data.data]
        })
        wx.hideLoading()
      },
      fail: () => {
        if (this.data.i != 0) {
          this.setData({
            i: this.data.i - 1
          })
          wx.hideLoading()
          wx.showToast({
            icon: 'none',
            title: '加载错误'
          })
        }
      }
    })
  },
  //获取不同数量图片的总高度
  getImgHeight() {
    let height = 0
    let arr = []
    this.data.content.map((o, i) => arr.push(height += o.y / o.x * wx.getSystemInfoSync().windowWidth))
    this.setData({
      imgListHeight: arr
    })
  },
  //根据滚动条距离顶部距离以及图片的高度更改当前阅读进度
  onPageScroll(res) {
    if (this.data.showImgIndex != this.data.imgListHeight.findIndex(o => o - wx.getSystemInfoSync().windowHeight / 3 * 2 > res.scrollTop) + 1) {
      this.setData({
        showImgIndex: this.data.imgListHeight.findIndex(o => o - wx.getSystemInfoSync().windowHeight / 3 * 2 > res.scrollTop) + 1
      })
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    //设置头部标题
    wx.setNavigationBarTitle({
      title: options.title
    })
    //显示loading
    wx.showLoading({
      title: '加载中',
    })
    //设置章节id
    this.setData({
      ep_id: options.ep_id
    })
    //获取当前章节内容
    db.collection('comic_content').where({
        _id: options.ep_id * 1
      })
      .get({
        success: (res) => {
          if (res.data.length > 0) {
            this.setData({
              content: res.data[0].content,
              showContent: res.data[0].showContent
            })
            this.getImgList()
            this.getImgHeight()
          } else {
            wx.request({
              url: `https://apis.netstart.cn/mbcomic/GetImageIndex?ep_id=${options.ep_id}`,
              success: (res) => {
                this.setData({
                  content: res.data.data.images,
                  showContent: new Array(Math.ceil(res.data.data.images.length / 10)).fill(null).map((item, index) => res.data.data.images.slice(index * 10, (index + 1) * 10))
                })
                db.collection('comic_content').add({
                  data: {
                    _id: options.ep_id * 1,
                    content: res.data.data.images,
                    showContent: new Array(Math.ceil(res.data.data.images.length / 10)).fill(null).map((item, index) => res.data.data.images.slice(index * 10, (index + 1) * 10))
                  },
                  success: (result) => {}
                })
                this.getImgList()
                this.getImgHeight()
              }
            })
          }
        }
      })
    //获取章节详情和列表
    db.collection('comic_msg').where({
        _id: options.comic_id * 1
      })
      .get({
        success: (res) => {
          this.setData({
            msg: res.data[0].msg,
            ep_list: res.data[0].msg.ep_list,
            currentIndex: res.data[0].msg.ep_list.findIndex(item => item.id == options.ep_id)
          })
          //添加历史记录,根据登录状态向数据库或者localStorage中添加或更新阅读历史
          db.collection('is_login').where({
            _id: 'is_login'
          }).get({
            success: (result) => {
              if (result.data[0].is_login && result.data[0].data + 7 * 24 * 60 * 60 * 1000 > Date.parse(new Date())) {
                db.collection('history').add({
                  data: {
                    _id: options.comic_id * 1,
                    title: options.title,
                    ep_index: res.data[0].msg.ep_list.findIndex(item => item.id == options.ep_id),
                    short_title: res.data[0].msg.ep_list[res.data[0].msg.ep_list.findIndex(item => item.id == options.ep_id)].short_title,
                    img: res.data[0].msg.vertical_cover,
                    total: res.data[0].msg.total,
                    is_finish: res.data[0].msg.is_finish
                  },
                  success: (result) => {}
                })
                db.collection('history').doc(options.comic_id * 1).update({
                  data: {
                    ep_index: res.data[0].msg.ep_list.findIndex(item => item.id == options.ep_id),
                    short_title: res.data[0].msg.ep_list[res.data[0].msg.ep_list.findIndex(item => item.id == options.ep_id)].short_title,
                    total: res.data[0].msg.total,
                    is_finish: res.data[0].msg.is_finish
                  },
                  success: (res) => {}
                })
                db.collection('rack').doc(options.comic_id * 1).update({
                  data: {
                    ep_index: res.data[0].msg.ep_list.findIndex(item => item.id == options.ep_id),
                    is_finish: res.data[0].msg.is_finish,
                    short_title: res.data[0].msg.ep_list[res.data[0].msg.ep_list.findIndex(item => item.id == options.ep_id)].short_title
                  },
                  success: (res) => {}
                })
              } else {
                if (!wx.getStorageSync('history')) {
                  wx.setStorageSync('history', JSON.stringify([{
                    _id: options.comic_id * 1,
                    title: options.title,
                    ep_index: res.data[0].msg.ep_list.findIndex(item => item.id == options.ep_id),
                    short_title: res.data[0].msg.ep_list[res.data[0].msg.ep_list.findIndex(item => item.id == options.ep_id)].short_title,
                    img: res.data[0].msg.vertical_cover,
                    total: res.data[0].msg.total,
                    is_finish: res.data[0].msg.is_finish
                  }]))
                } else {
                  wx.setStorageSync('history', JSON.stringify([{
                    _id: options.comic_id * 1,
                    title: options.title,
                    ep_index: res.data[0].msg.ep_list.findIndex(item => item.id == options.ep_id),
                    short_title: res.data[0].msg.ep_list[res.data[0].msg.ep_list.findIndex(item => item.id == options.ep_id)].short_title,
                    img: res.data[0].msg.vertical_cover,
                    total: res.data[0].msg.total,
                    is_finish: res.data[0].msg.is_finish
                  }, ...JSON.parse(wx.getStorageSync('history')).filter(item => item._id != options.comic_id)]))
                }
                if (!wx.getStorageSync('rack')) {
                  wx.setStorageSync('rack', JSON.stringify([Object.assign(JSON.parse(wx.getStorageSync('rack')).filter(item => item._id != options.comic_id)[0], 
                  {
                    ep_index: res.data[0].msg.ep_list.findIndex(item => item.id == options.ep_id),
                    is_finish: res.data[0].msg.is_finish,
                    short_title: res.data[0].msg.ep_list[res.data[0].msg.ep_list.findIndex(item => item.id == options.ep_id)].short_title
                  })]))
                } else {
                  wx.setStorageSync('history', JSON.stringify([Object.assign(JSON.parse(wx.getStorageSync('rack')).filter(item => item._id != options.comic_id)[0], 
                  {
                    ep_index: res.data[0].msg.ep_list.findIndex(item => item.id == options.ep_id),
                    is_finish: res.data[0].msg.is_finish,
                    short_title: res.data[0].msg.ep_list[res.data[0].msg.ep_list.findIndex(item => item.id == options.ep_id)].short_title
                  }), ...JSON.parse(wx.getStorageSync('rack')).filter(item => item._id != options.comic_id)]))
                }
              }
            }
          })
        }
      })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {},

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
    //判断当前章节图片是否加载完成,是则跳转下一章,否则加载剩下图片的链接和token
    if (this.data.imgList.length == this.data.content.length) {
      // 判断是否是最后一章,是则提示当前已经是最后一章了,否则跳转下一章
      if (this.data.currentIndex == this.data.ep_list.length - 1) {
        wx.showToast({
          icon: 'none',
          title: '已经是最后一章'
        });
      } else {
        wx.redirectTo({
          url: `../read/read?comic_id=${this.data.msg.id}&ep_id=${this.data.ep_list[this.data.currentIndex+1].id}&title=${this.data.msg.title}`,
        })
      }
    } else {
      wx.showLoading({
        title: '加载中',
        mask: true
      })
      this.setData({
        i: this.data.i + 1
      })
      this.getImgList()
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})