// pages/mine/mine.js
const db = wx.cloud.database()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    user_img: null,
    user_name: null,
    isLogin: false,
    openid: null,
    is_change_name: false,
    is_login: false,
    list: null,
    type: 'rack',
    is_delete: false
  },
  //弹出是否登录提示框
  login() {
    this.setData({
      is_login: true
    })
  },
  //修改用户头像
  changeUserImg() {
    // 获取网络链接
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        //转换成base64位
        wx.getFileSystemManager().readFile({
          filePath: res.tempFiles[0].tempFilePath,
          encoding: "base64",
          success: (result) => {
            //更新用户头像
            db.collection('user_login').doc(this.data.openid).update({
              data: {
                user_img: result.data
              },
              success: () => {
                this.setData({
                  user_img: result.data
                })
              }
            })
          }
        })
      }
    })
  },
  //显示修改用户名弹窗
  showChangeUserName() {
    this.setData({
      is_change_name: true
    })
  },
  //修改用户名
  changeUserName(event) {
    this.setData({
      user_name: event.detail.value,
      is_change_name: false
    })
    //更新用户名
    db.collection('user_login').doc(this.data.openid).update({
      data: {
        user_name: event.detail.value
      }
    })
  },
  //退出登录
  quitLogin() {
    this.setData({
      isLogin: false,
      list: null
    })
    //清除本地存储的关注漫画数据和阅读历史数据
    wx.removeStorageSync('rack')
    wx.removeStorageSync('history')
    //更新云开发数据库的登录状态
    db.collection('is_login').doc('is_login').update({
      data: {
        is_login: false
      },
      success: (result) => {}
    })
    //获取登录code用于后续重新登录
    wx.login({
      timeout: 10000,
      success: (res) => {
        this.setData({
          code: res.code
        })
      }
    })
  },
  //确定登录
  confirm() {
    //通过微信小程序的api获取openid和session
    wx.request({
      url: `https://api.weixin.qq.com/sns/jscode2session?appid=wx73b0a1fa76d7e03b&secret=b00c3f3deb917f40c1addd4611958446&js_code=${this.data.code}&grant_type=authorization_code`,
      success: (res) => {
        this.setData({
          openid: res.data.openid,
          isLogin: true,
          is_login: false
        })
        //将openid存储在localStorage中
        wx.setStorageSync('user_id', res.data.openid)
        //如果是新用户,向数据库中添加数据
        db.collection('is_login').add({
          data: {
            _id: `is_login`,
            session_key: res.data.session_key,
            is_login: true,
            data: Date.parse(new Date())
          },
          success: (result) => {}
        })
        db.collection('user_login').add({
          data: {
            _id: res.data.openid,
            user_img: 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132',
            user_name: '微信用户'
          },
          success: (result) => {
            this.setData({
              user_img: 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132',
              user_name: '微信用户'
            })
          }
        })
        //已有用户的登录,更新登录状态和主动登录时间,主动登录7天内小程序自动登录
        db.collection('is_login').doc('is_login').update({
          data: {
            session_key: res.data.session_key,
            is_login: true,
            data: Date.parse(new Date())
          },
          success: (result) => {}
        })
        //获取用户头像和昵称
        db.collection('user_login').where({
          _id: res.data.openid
        }).get({
          success: (result) => {
            this.setData({
              user_img: result.data[0].user_img,
              user_name: result.data[0].user_name
            })
          }
        })
        //如果本地有关注数据存储,添加到数据库中
        if (wx.getStorageSync('rack')) {
          JSON.parse(wx.getStorageSync('rack')).map(item =>
            db.collection('rack').add({
              data: item
            }));
        }
        //如果本地有阅读历史记录存储,添加到数据库中
        if (wx.getStorageSync('history')) {
          JSON.parse(wx.getStorageSync('history')).map(item => {
            db.collection('history').add({
              data: item
            })
            db.collection('history').doc(item._id).update({
              data: item
            })
          });
        }
        //获取关注或阅读历史数据
        this.getRackOrHistory()
      }
    })
  },
  //取消登录
  cancel() {
    this.setData({
      is_login: false
    })
  },
  //跳转漫画详情页,携带漫画id和名字
  toParticulars(event) {
    wx.navigateTo({
      url: `../particulars/particulars?id=${event.currentTarget.dataset.season_id}&title=${event.currentTarget.dataset.title}`,
    })
  },
  //切换显示我的关注/阅读历史,并重新获取数据
  changeType(event) {
    if (this.data.type != event.currentTarget.dataset.type) {
      this.setData({
        type: event.currentTarget.dataset.type
      })
    }
    this.getRackOrHistory()
  },
  //获取我的关注或阅读历史的数据
  getRackOrHistory() {
    //是否登录
    if (this.data.isLogin) {
      //是则从云开发数据库中获取数据
      if (this.data.type == 'rack') {
        db.collection('rack').where({
          _openid: wx.getStorageSync('user_id')
        }).get({
          success: (res) => {
            this.setData({
              list: res.data.reverse()
            })
          }
        })
      } else {
        db.collection('history').where({
          _openid: wx.getStorageSync('user_id')
        }).get({
          success: (res) => {
            this.setData({
              list: res.data.reverse()
            })
          }
        })
      }
    } else {
      //否则从本地存储中获取数据
      if (this.data.type == 'rack') {
        if (wx.getStorageSync('rack')) {
          this.setData({
            list: JSON.parse(wx.getStorageSync('rack'))
          })
        }
      } else {
        if (wx.getStorageSync('history')) {
          this.setData({
            list: JSON.parse(wx.getStorageSync('history'))
          })
        }
      }
    }
  },
  //显示删除按钮
  addDelete() {
    this.setData({
      is_delete: true
    })
  },
  //隐藏删除按钮
  hiddenDelete() {
    this.setData({
      is_delete: false
    })
  },
  //删除点击的数据,根据登录状态从数据库或本地存储中删除
  delete(event) {
    if (this.data.isLogin) {
      if (this.data.type == 'rack') {
        db.collection('rack').doc(event.currentTarget.dataset.id).remove({
          success: (res) => {}
        })
      } else {
        db.collection('history').doc(event.currentTarget.dataset.id).remove({
          success: (res) => {}
        })
      }
    } else {
      if (this.data.type == 'rack') {
        wx.setStorageSync('rack', JSON.stringify(JSON.parse(wx.getStorageSync('rack')).filter(item => item._id != event.currentTarget.dataset.id)))
      } else {
        wx.setStorageSync('history', JSON.stringify(JSON.parse(wx.getStorageSync('history')).filter(item => item._id != event.currentTarget.dataset.id)))
      }
    }
    this.setData({
      list: this.data.list.filter(item=>item._id!=event.currentTarget.dataset.id)
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    //本地是否存有openid,否则获取code
    if (wx.getStorageSync('user_id')) {
      //设置openid
      this.setData({
        openid: wx.getStorageSync('user_id')
      })
      //根据数据库中的登录状态和时间确定是否可以自动登录,是则获取用户头像和昵称以及我的关注数据,否则获取code
      db.collection('is_login').where({
        _id: 'is_login'
      }).get({
        success: (result) => {
          if (result.data[0].is_login && result.data[0].data + 7 * 24 * 60 * 60 * 1000 > Date.parse(new Date())) {
            this.setData({
              isLogin: true
            })
            db.collection('user_login').where({
              _id: wx.getStorageSync('user_id')
            }).get({
              success: (result) => {
                this.setData({
                  user_img: result.data[0].user_img,
                  user_name: result.data[0].user_name
                })
              }
            })
            this.getRackOrHistory()
          } else {
            wx.login({
              timeout: 10000,
              success: (res) => {
                this.setData({
                  code: res.code
                })
              }
            })
            this.getRackOrHistory()
          }
        }
      })
    } else {
      wx.login({
        timeout: 10000,
        success: (res) => {
          this.setData({
            code: res.code
          })
        }
      })
      this.getRackOrHistory()
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    //重新进行页面更新数据
    this.onLoad()
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