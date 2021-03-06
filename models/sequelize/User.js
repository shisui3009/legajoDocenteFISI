'use strict';

var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

var instanceMethods = {
  getGravatarUrl: function(size) {
    if (!size) size = 200;

    if (!this.email) {
      return 'https://gravatar.com/avatar/?s=' + size + '&d=retro';
    }

    var md5 = crypto.createHash('md5').update(this.email).digest('hex');
    return 'https://gravatar.com/avatar/' + md5 + '?s=' + size + '&d=retro';
  },
  getProfilePicture: function(size) {
    if(this.profile && this.profile.picture != null)
      return this.profile.picture;

    return this.getGravatarUrl(size);
  },
  hasSetPassword: function() {
    return this.password != null && this.password.length > 0;
  }
};

var beforeSaveHook = function(user, options, fn) {
  if(user.changed('password')) {
    this.encryptPassword(user.password, function(hash, err) {
      user.password = hash;
      fn(null, user);
    });
    return;
  }
  fn(null, user);
};

module.exports = function(db, DataTypes) {
  var User = db.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      isEmail: true
    },
    nombres: DataTypes.STRING,
    apell_pat: DataTypes.STRING,
    apell_mat: DataTypes.STRING,
    pais: DataTypes.STRING,
    tipo_document: DataTypes.STRING,
    nro_document: DataTypes.INTEGER,
    codigo: DataTypes.STRING,
    telefono: DataTypes.INTEGER,
    celular: DataTypes.INTEGER,
    password: DataTypes.STRING,
    genero: DataTypes.STRING(1),
    pag_web: DataTypes.STRING,
    foto: DataTypes.STRING,
    fecha_nac: DataTypes.DATE,
    direccion: DataTypes.STRING,
    
    facebookId: {
      type: DataTypes.STRING,
      unique: true
    },
    linkedInId: {
      type: DataTypes.STRING,
      unique: true
    },
    
    resetPasswordExpires: DataTypes.DATE,
    resetPasswordToken: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    
    profile: DataTypes.JSON,
    tokens: DataTypes.JSON
  }, {
    tableName: 'docente',
    instanceMethods: instanceMethods,
    classMethods: {
      associate: function(models) {
        User.hasMany(models.PerfilAcademico);
        User.hasMany(models.InformacionDocente);
      },
      encryptPassword: function(password, cb) {
        if (!password) {
          cb('', null);
          return;
        }

        bcrypt.genSalt(10, function(err, salt) {
          if (err) { cb(null, err); return; }
          bcrypt.hash(password, salt, null, function(hErr, hash) {
            if (hErr) { cb(null, hErr); return; }
            cb(hash, null);
          });
        });
      },
      findUser: function(email, password, cb) {
        User.findOne({
          where: { email: email }
        })
        .then(function(user) {
          if(user == null || user.password == null || user.password.length === 0) {
            cb('User / Password combination is not correct', null);
            return;
          }
          bcrypt.compare(password, user.password, function(err, res) {
            if(res)
              cb(null, user);
            else
              cb(err, null);
          });
        })
        .catch(function(serr) { cb(serr, null); });
      }
    },
    hooks: {
      beforeUpdate: beforeSaveHook,
      beforeCreate: beforeSaveHook
    },
    indexes: [
      {
        name: 'facebookIdIndex',
        method: 'BTREE',
        fields: ['facebookId']
      },
      {
        name: 'linkedInIdIndex',
        method: 'BTREE',
        fields: ['linkedInId']
      },
    ]
  });

  return User;
};