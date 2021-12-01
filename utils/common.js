const app = require('../server/server')

async function generateIdentifier(length){
  let result = '';
  let characters = '0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
 async function generateRandomPassword(length){
  let result = '';
  let characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!#%()_:';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function checkIfUserIsAdminOrNot(userId) {
  let userModel = app.models.user;

  return userModel.find({
    where: {
      _id: userId,
      is_admin: true,
      is_deleted: false
    }
  }).then((res) => {
    return res.length > 0;
  }).catch((e) => {
    return false;
  })
}

module.exports = {
  generateIdentifier,
  generateRandomPassword,
  checkIfUserIsAdminOrNot
}
