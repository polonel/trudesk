const blacklistSchema = require('../models/blacklist');

async function blacklistCheck(message) {
  try {
    const docs = await blacklistSchema.find({});

    // Merge all regex fields into one RegExp variable
    const regexStr = docs
      .filter((doc) => doc.regex)
      .map((doc) => doc.regex)
      .join('|');

    const mergedRegex = new RegExp(regexStr, 'g');
    let mergedRegexValidate;
    if (docs.length === 0) {
      if (String(mergedRegex) !== '/(?:)/g') {
        mergedRegexValidate = mergedRegex.test(message.from);
      }
    } else return false;

    if (mergedRegexValidate) {
      return true;
    }
    return false;
  } catch (err) {
    console.error(err);
    return false;
  }
}

module.exports = blacklistCheck;
