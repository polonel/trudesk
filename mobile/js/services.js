angular
  .module('trudesk.services', [])
  .factory('WebSocket', function ($q, $rootScope, $timeout, $http, $localStorage) {
    var dataStream = io.connect('/', {
      query: 'token=' + $localStorage.accessToken
    })

    var message

    //Socket.io events
    dataStream.on('connect', function () {
      console.log('Connected to Server: ' + $localStorage.server)
    })

    dataStream.on('disconnect', function () {
      console.log('Disconnected from Server: ' + $localStorage.server)
    })

    dataStream.on('error', function (e) {
      console.log('Error', e)
    })

    dataStream.on('joinSuccessfully', function () {
      console.log('Joined Messaging Server.')
    })

    dataStream.removeAllListeners('chatMessage')
    dataStream.on('chatMessage', function (data) {
      // console.log('Chat Message Receieved: ', data);
      window.dispatchEvent(new CustomEvent('$trudesk.converstation.chatmessage', { detail: data }))
      // ionic.trigger('$trudesk.conversation.chatmessage', data);
    })

    dataStream.on('updateUsers', function (users) {
      window.dispatchEvent(new CustomEvent('$trudesk.conversation.updateusers', { detail: users }))
      // ionic.trigger('$trudesk.conversation.updateusers', users);
    })

    dataStream.on('chatTyping', function (data) {
      ionic.trigger('$trudesk.conversation.usertyping', data)
    })

    dataStream.on('chatStopTyping', function (data) {
      ionic.trigger('$trudesk.conversation.userstoptyping', data)
    })

    return {
      message: message,
      socket: dataStream,
      startTyping: function (convoId, partnerId, loggedInUserId) {
        dataStream.emit('chatTyping', {
          cid: convoId,
          to: partnerId,
          from: loggedInUserId
        })
      },
      stopTyping: function (convoId, partnerId) {
        dataStream.emit('chatStopTyping', {
          cid: convoId,
          to: partnerId
        })
      },
      send: function (convoId, partnerId, loggedInUserId, messageId, messageBody) {
        dataStream.emit('chatMessage', {
          conversation: convoId,
          to: partnerId,
          from: loggedInUserId,
          type: 's',
          messageId: messageId,
          message: messageBody
        })
      },
      updateUsers: function () {
        return dataStream.emit('updateUsers')
      },
      checkConnection: function () {
        if (dataStream == undefined || !dataStream.connected) {
          console.log('Reconnecting to: ' + $localStorage.server)
          dataStream = undefined
          dataStream = io.connect('http://' + $localStorage.server, {
            query: 'token=' + $localStorage.accessToken
          })
        }
      },
      close: function () {
        console.log('Closing Socket...')
        return dataStream.disconnect()
      }
    }
  })
  .factory('Users', function ($q, $http, $localStorage) {
    return {
      getImage: function (url) {
        return new Promise(function (resolve, reject) {
          $http
            .get(url, {
              method: 'GET',
              headers: {
                accesstoken: $localStorage.accessToken
              }
            })
            .then(function (response) {
              var objectUrl = URL.createObjectURL(response.blob())
              return resolve(objectUrl)
            })
            .catch(function (err) {
              return reject(err)
            })
        })
      },
      get: function (username) {
        return $http.get('/api/v1/users/' + username, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      getUsers: function () {
        return $http.get('/api/v1/users?limit=-1', {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      getAssignees: function () {
        return $http.get('/api/v1/users/getassignees', {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      getRoles: function () {
        return $http.get('/api/v1/roles', {
          headers: {
            accesstoken: $localStroage.accessToken
          }
        })
      },
      getLoggedInUser: function () {
        var deferred = $q.defer()
        if ($localStorage.loggedInUser) {
          deferred.resolve($localStorage.loggedInUser)
          return deferred.promise
        }

        if (!$localStorage.username) deferred.reject('No username stored.')
        else {
          $http
            .get('/api/v1/users/' + $localStorage.username, {
              headers: {
                accesstoken: $localStorage.accessToken
              }
            })
            .then(
              function successCallback (response) {
                if (response.data.user) {
                  $localStorage.loggedInUser = response.data.user
                  if ($localStorage.loggedInUser.image === undefined)
                    $localStorage.loggedInUser.image = 'defaultProfile.jpg'
                  deferred.resolve($localStorage.loggedInUser)
                } else {
                  deferred.reject('Unable to get user')
                }
              },
              function errorCallback (response) {
                console.log(response)
                deferred.reject('Error Occured!')
              }
            )
        }

        return deferred.promise
      },
      isUserOnline: function (onlineUsers, userObj) {
        if (userObj === undefined) return false
        if (onlineUsers === undefined) return false
        return onlineUsers[userObj.username] !== undefined
      }
    }
  })

  .factory('Tickets', function ($http, $localStorage) {
    return {
      all: function (page) {
        if (page === undefined) page = 0

        var queryString = '/api/v1/tickets?limit=' + 10 + '&status[]=0&status[]=1&status[]=2&page=' + page
        if ($localStorage.showClosedTickets !== undefined && $localStorage.showClosedTickets === true)
          queryString += '&status[]=3'
        if ($localStorage.showOnlyAssigned !== undefined && $localStorage.showOnlyAssigned === true)
          queryString += '&assignedself=true'
        return $http.get(queryString, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      get: function (uid) {
        return $http.get('/api/v1/tickets/' + uid, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      create: function (ticket) {
        return $http.post('/api/v1/tickets/create', ticket, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      search: function (search) {
        return $http.get('/api/v1/tickets/search/?search=' + search, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      update: function (ticket) {
        return $http.put('/api/v1/tickets/' + ticket._id, ticket, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      addComment: function (ticket, comment) {
        return $http.post(
          '/api/v1/tickets/addcomment',
          {
            _id: ticket._id,
            comment: comment.comment,
            ownerId: comment.ownerId
          },
          {
            headers: {
              accesstoken: $localStorage.accessToken
            }
          }
        )
      },
      addNote: function (ticket, note) {
        return $http.post(
          '/api/v1/tickets/addnote',
          {
            ticketid: ticket._id,
            note: note.note,
            owner: note.ownerId
          },
          {
            headers: {
              accesstoken: $localStorage.accessToken
            }
          }
        )
      },
      ticketStats: function (timespan) {
        return $http.get('/api/v1/tickets/stats/' + timespan, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      }
    }
  })

  .factory('Groups', function ($http, $localStorage) {
    return {
      all: function () {
        return $http.get('/api/v1/groups', {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      get: function (_id) {
        return $http.get('/api/v1/groups/' + _id, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      }
    }
  })

  .factory('TicketTypes', function ($http, $localStorage) {
    return {
      all: function () {
        return $http.get('/api/v1/tickets/types', {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      get: function (typeId) {
        return $http.get('http://' + $localStorage.server + '/api/v1/tickets/type/' + typeId, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      }
    }
  })

  .factory('Priorities', function ($http, $localStorage) {
    return {
      all: function () {
        return $http.get('http://' + $localStorage.server + '/api/v1/tickets/priorities', {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      }
    }
  })

  .factory('Messages', function ($http, $localStorage) {
    return {
      getConversation: function (convoId, page) {
        if (page === undefined) page = 0

        var queryString = '/api/v1/messages/conversation/' + convoId + '?page=' + page
        return $http.get(queryString, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      getRecent: function () {
        return $http.get('/api/v1/messages/conversations/recent', {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      sendMessage: function (convoId, message) {
        return $http.post(
          '/api/v1/messages/send',
          {
            cId: convoId,
            owner: message.ownerId,
            body: message.body
          },
          {
            headers: {
              accesstoken: $localStorage.accessToken
            }
          }
        )
      },
      startConversation: function (userId) {
        return $http.post(
          '/api/v1/messages/conversation/start',
          {
            owner: $localStorage.loggedInUser._id,
            participants: [$localStorage.loggedInUser._id, userId]
          },
          {
            headers: {
              accesstoken: $localStorage.accessToken
            }
          }
        )
      },
      deleteConversation: function (convoId) {
        return $http.delete('/api/v1/messages/conversation/' + convoId, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      }
    }
  })

  .factory('Graphs', function ($http, $localStorage) {
    return {
      topGroups: function () {
        return $http.get('/api/v1/tickets/count/topgroups', {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      }
    }
  })

  .factory('Camera', function ($q, $cordovaCamera, $ionicPlatform) {
    return {
      open: function () {
        var deferred = $q.defer()
        if (ionic.Platform.isWebView()) {
          var options = {
            quality: 80,
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: Camera.PictureSourceType.CAMERA,
            encodingType: Camera.EncodingType.JPEG
          }

          $cordovaCamera.getPicture(options).then(function (fileURL) {
            deferred.resolve(fileURL)
          })
        } else {
          deferred.reject('Not Supported in browser')
        }

        return deferred.promise
      },
      library: function () {
        var deferred = $q.defer()
        if (ionic.Platform.isWebView()) {
          var options = {
            quality: 80,
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
            encodingType: Camera.EncodingType.JPEG
          }

          $cordovaCamera.getPicture(options).then(function (fileURL) {
            if ($ionicPlatform.is('ios')) return deferred.resolve(fileURL)
            else if ($ionicPlatform.is('android'))
              // Fixed content:// Paths when loading library files on Android 4.4+
              window.FilePath.resolveNativePath(fileURL, function (resolvedFileURI) {
                return deferred.resolve(resolvedFileURI)
              })
            else return deferred.reject('Unsupported Platform')
          })
        } else {
          deferred.reject('Not Supported in browser')
        }

        return deferred.promise
      }
    }
  })

  .factory('Upload', function ($q, $cordovaCamera, $cordovaFileTransfer, $localStorage) {
    return {
      profilePicture: function (fileURL) {
        var deferred = $q.defer()
        if (ionic.Platform.isWebView()) {
          var serverURL = '/api/v1/users/' + $localStorage.username + '/uploadprofilepic'

          var uploadOptions = new FileUploadOptions()
          uploadOptions.fileKey = 'file'
          uploadOptions.fileName = fileURL.substr(fileURL.lastIndexOf('/') + 1)
          uploadOptions.mimeType = 'image/jpeg'

          var ft = new FileTransfer()

          ft.upload(
            fileURL,
            encodeURI(serverURL),
            function (result) {
              var response = result.response
              var responseObj = JSON.parse(response)
              deferred.resolve(responseObj)
            },
            function (err) {
              deferred.reject(err)
            },
            uploadOptions
          )
        } else {
          deferred.reject('Not Supported')
        }

        return deferred.promise
      }
    }
  })
