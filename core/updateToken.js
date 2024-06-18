const { Owner } = require('../models/Owner');
const { Admin } = require('../models/Admin');

exports.updateToken = async (id, key, model) => {
  try {
    if (['Owner', 'Admin'].includes(model)) {
      if (model === 'Owner') {
        await Owner.findByIdAndUpdate(id, {
          token: key,
        });

        if (model === 'Admin') {
          await Owner.findByIdAndUpdate(id, {
            token: key,
          });
        }
      }
    }

    return true;
  } catch (e) {
    Error(e.stack);
  }
};

