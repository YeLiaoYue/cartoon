// pages/particulars/particulars.js
const db = wx.cloud.database()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    msg: null,
    ep_list: null,
    isJoin: false,
    isHideSynopsis: true,
    isShowAll: false,
    ascending: true,
    recommend: null,
    loading: true,
    ep_index: 0,
    comic_id: null,
    is_login: false
  },
  //根据登录状态从数据库或本地存储中添加/移除漫画数据
  changeIsJoin() {
    if (this.data.isJoin) {
      if (this.data.is_login) {
        db.collection('rack').doc(this.data.msg.id * 1).remove()
      } else {
        wx.setStorageSync('rack', JSON.parse(wx.getStorageSync('rack')).filter(item => item._id != this.data.comic_id))
      }
    } else {
      if (this.data.is_login) {
        db.collection('rack').add({
          data: {
            _id: this.data.msg.id,
            title: this.data.msg.title,
            total: this.data.msg.total,
            ep_index: this.data.ep_index,
            img: this.data.msg.vertical_cover,
            is_finish: this.data.msg.is_finish,
            short_title: this.data.msg.ep_list[this.data.ep_index].short_title
          }
        })
      } else {
        if (!wx.getStorageSync('rack')) {
          wx.setStorageSync('rack', JSON.stringify([{
            _id: this.data.msg.id,
            title: this.data.msg.title,
            total: this.data.msg.total,
            ep_index: this.data.ep_index,
            img: this.data.msg.vertical_cover,
            is_finish: this.data.msg.is_finish,
            short_title: this.data.msg.ep_list[this.data.ep_index].short_title
          }]))
        } else {
          wx.setStorageSync('rack', JSON.stringify([{
            _id: this.data.msg.id,
            title: this.data.msg.title,
            total: this.data.msg.total,
            ep_index: this.data.ep_index,
            img: this.data.msg.vertical_cover,
            is_finish: this.data.msg.is_finish,
            short_title: this.data.msg.ep_list[this.data.ep_index].short_title
          }, ...JSON.parse(wx.getStorageSync('rack')).filter(item => item._id != this.data.msg.id)]))
        }
      }
    }
    this.setData({
      isJoin: !this.data.isJoin
    })
  },
  //显示全部简介内容
  changeIsHideSynopsis() {
    this.setData({
      isHideSynopsis: false
    })
  },
  //显示所有目录
  chageIsShowAll() {
    this.setData({
      isShowAll: true
    })
  },
  //改变目录的升/降序
  changeAscending() {
    this.setData({
      ascending: !this.data.ascending
    })
  },
  //携带漫画id和名字跳转到漫画详情页
  toParticulars(event) {
    wx.redirectTo({
      url: `../particulars/particulars?id=${event.currentTarget.dataset.season_id}&title=${event.currentTarget.dataset.title}`,
    })
  },
  //携带漫画id,章节id以及漫画名字跳转到阅读页
  toRead(event) {
    wx.navigateTo({
      url: `../read/read?comic_id=${event.currentTarget.dataset.comic_id}&ep_id=${event.currentTarget.dataset.ep_id}&title=${event.currentTarget.dataset.title}`,
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    //判断是否是登录状态
    db.collection('is_login').where({
      _id: 'is_login'
    }).get({
      success: (result) => {
        //是则根据数据库数据判断是否关注该漫画,否则从localStorage中判断是否关注该漫画
        if (result.data[0].is_login && result.data[0].data + 7 * 24 * 60 * 60 * 1000 > Date.parse(new Date())) {
          this.setData({
            is_login: true
          })
          db.collection('rack').doc(options.id * 1).get({
            success: (res) => {
              this.setData({
                isJoin: true
              })
            }
          })
        } else {
          if (JSON.parse(wx.getStorageSync('rack')).filter(item => item._id == options.id).length > 0) {
            this.setData({
              isJoin: true
            })
          }
        }
      }
    })
    this.setData({
      comic_id: options.id * 1
    })
    //设置头部标题
    wx.setNavigationBarTitle({
      title: options.title
    })
    //显示loading
    wx.showLoading({
      title: '加载中',
    })
    //获取漫画详情信息
    wx.request({
      url: `https://apis.netstart.cn/mbcomic/ComicDetail?comic_id=${options.id}`,
      success: (res) => {
        this.setData({
          msg: res.data.data,
          ep_list: res.data.data.ep_list.reverse()
        })
        //添加或更新数据库中的漫画详情信息
        db.collection('comic_msg').add({
          data: {
            _id: res.data.data.id,
            msg: res.data.data
          },
          success: (result) => {}
        })
        db.collection('comic_msg').doc(res.data.data.id).update({
          data: {
            msg: res.data.data
          },
          success: (result) => {}
        })
        //隐藏loading和骨架屏
        if (this.data.comment != null && this.data.recommend != null) {
          wx.hideLoading()
          this.setData({
            loading: false
          })
        }
      },
      fail: () => {
        //错误的时候尝试从数据库中获取信息
        db.collection('comic_msg').where({
            _id: options.id * 1
          })
          .get({
            success: (res) => {
              this.setData({
                msg: res.data[0].msg
              })
            }
          })
        // 提示加载错误
        wx.showToast({
          icon: 'none',
          title: '加载错误',
        })
      }
    })
    //获取漫画评论
    wx.request({
      url: `https://apis.netstart.cn/mbcomic/reply?oid=${options.id}`,
      success: (res) => {
        this.setData({
          comment: res.data.data
        })
        if (this.data.msg != null && this.data.recommend != null) {
          wx.hideLoading()
          this.setData({
            loading: false
          })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({
          icon: 'none',
          title: '加载错误',
        })
        this.setData({
          loading: false
        })
      }
    })
    //获取推荐列表
    wx.request({
      url: `https://apis.netstart.cn/mbcomic/Recommend?comic_id=${options.id}`,
      success: (res) => {
        this.setData({
          recommend: res.data.data
        })
        if (this.data.comment != null && this.data.msg != null) {
          wx.hideLoading()
          this.setData({
            loading: false
          })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({
          icon: 'none',
          title: '加载错误',
        })
        this.setData({
          loading: false
        })
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
    //进入页面重新获取观看进度,根据登录状态从数据库或localStorage中获取
    db.collection('is_login').where({
      _id: 'is_login'
    }).get({
      success: (result) => {
        if (result.data[0].is_login && result.data[0].data + 7 * 24 * 60 * 60 * 1000 > Date.parse(new Date())) {
          db.collection('rack').where({
              _id: this.data.comic_id
            })
            .get({
              success: (res) => {
                this.setData({
                  ep_index: res.data[0].ep_index
                })
              }
            })
          db.collection('history').where({
              _id: this.data.comic_id
            })
            .get({
              success: (res) => {
                this.setData({
                  ep_index: res.data[0].ep_index
                })
              }
            })
        } else {
          if (wx.getStorageSync('history')) {
            if (JSON.parse(wx.getStorageSync('rack')).filter(item => item._id == this.data.comic_id).length > 0) {
              this.setData({
                ep_index: JSON.parse(wx.getStorageSync('rack')).filter(item => item._id == this.data.comic_id)[0].ep_index
              })
            }
            if (JSON.parse(wx.getStorageSync('history')).filter(item => item._id == this.data.comic_id).length > 0) {
              this.setData({
                ep_index: JSON.parse(wx.getStorageSync('history')).filter(item => item._id == this.data.comic_id)[0].ep_index
              })
            }
          }
        }
      }
    })
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