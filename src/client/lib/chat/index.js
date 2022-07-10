import axios from 'axios'

const startConversation = (owner, receiver, callback) => {
  return new Promise((resolve, reject) => {
    if (owner === receiver) {
      if (typeof callback === 'function') return callback('Invalid Participants')

      return reject(new Error('Invalid Participants'))
    }

    axios
      .post('/api/v1/messages/conversation/start', {
        owner,
        participants: [owner, receiver]
      })
      .then(res => {
        if (typeof callback === 'function') return callback(null, res.data.conversation)

        return resolve(res.data.conversation)
      })
      .catch(err => {
        if (typeof callback === 'function') return callback(err)
        return reject(err)
      })
  })
}

const createChatWindow = (ownerId, receiverId, callback) => {
  return new Promise((resolve, reject) => {
    startConversation(ownerId, receiverId)
      .then(conversation => {
        axios
          .get(`/api/v1/messages/conversation/${conversation._id}`)
          .then(res => {})
          .catch(error => {
            if (typeof callback === 'function') return callback(error)

            return reject(error)
          })
      })
      .catch(error => {
        if (typeof callback === 'function') return callback(error)

        return reject(error)
      })
  })
}

export { startConversation, createChatWindow }
