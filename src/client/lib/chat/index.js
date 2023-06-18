import axios from 'api/axios'

export const startConversation = async function (owner, receiver, callback) {
  return new Promise((resolve, reject) => {
    if (owner === receiver) {
      if (typeof callback === 'function') return callback('Invalid Participants')

      return reject(new Error('Invalid Participants'))
    }

    axios
      .post('/api/v2/messages/conversations/start', {
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

export const createChatWindow = async function (ownerId, receiverId, callback) {
  return new Promise((resolve, reject) => {
    startConversation(ownerId, receiverId)
      .then(conversation => {
        axios
          .get(`/api/v2/messages/conversations/${conversation._id}`)
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

export default { startConversation, createChatWindow }
