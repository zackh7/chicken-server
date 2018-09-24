var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
var pg = require('pg');
var path = require('path');
var config = require('../config.js');
const roles = require("user-groups-roles");

var pool = new pg.Pool(config);

// roles.createNewRole('admin');
// roles.createNewRole("user");
// roles.createNewRole("manager");


// /*privileges*/
// roles.createNewPrivileges(['/add',"POST"], "This gets access to the article", false);
// roles.createNewPrivileges(['/add',"GET"], "This inserts to the article", false);
// roles.createNewPrivileges(['/add',"PUT"], "This edit the article", false);
// roles.createNewPrivileges(['/add',"DELETE"], "This deletes the article", false);
 
//  //admin

// roles.addPrivilegeToRole("admin",['/add',"GET"], true);
// roles.addPrivilegeToRole("admin",['/add',"POST"], true);
// roles.addPrivilegeToRole("admin", ['/add',"PUT"], true);
// roles.addPrivilegeToRole("admin", ['/add',"DELETE"], true);

// //editor
// roles.addPrivilegeToRole("manager",['/add',"POST"], true);
// roles.addPrivilegeToRole("manager", ['/add',"PUT"], true);

// //author
// roles.addPrivilegeToRole("user",['/add',"POST"], false);

/*router.get('/', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM role_master order by rm_id desc");
    query.on('row', (row) => {
      results.push(row);
    });
    query.on('end', () => {
      done();
      // pg.end();
      return res.json(results);
    });
  done(err);
  });
});*/
router.get('/', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT pm_id,pm_name,pm_add,pm_edit,pm_delete,pm_list FROM permission_master order by pm_id asc");
    query.on('row', (row) => {
      results.push(row);
    });
    query.on('end', () => {
      done();
      // pg.end();
      return res.json(results);
    });
  done(err);
  });
});

router.get('/:roleId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.roleId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT rm_name,rm_description,rm_status,rm_updated_at,rm_created_at FROM role_master where rm_id=$1',[id]);
    query.on('row', (row) => {
      results.push(row);
    });
    query.on('end', () => {
      done();
      // pg.end();
      return res.json(results);
    });
  done(err);
  });
});

router.get('/permission/:roleId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id=req.params.roleId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM  role_permission_master rpm left outer join permission_master pm on rpm.rpm_pm_id=pm.pm_id where rpm_rm_id=$1",[id]);
    query.on('row', (row) => {
      results.push(row);

    });
    query.on('end', () => {
      done();
      // pg.end();
      return res.json(results);
    });
  done(err);
  });
});

router.post('/add', oauth.authorise(), (req, res, next) => {
  const results = [];
  const role=req.body.role;
  const permission=req.body.permission;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    var singleInsert = "INSERT INTO role_master(rm_name, rm_description, rm_status) values($1,$2,0) RETURNING *",
        params = [role.rm_name,role.rm_description]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        permission.forEach(function(value, key){
          client.query('INSERT into role_permission_master(rpm_rm_id,rpm_pm_id,rpm_add,rpm_edit,rpm_delete,rpm_list) values($1,$2,$3,$4,$5,$6) RETURNING *',
            [result.rows[0].rm_id,value.pm_id,value.pm_add1,value.pm_edit1,value.pm_delete1,value.pm_list1]);
        });
        done();
        return res.json(results);
    });

    done(err);
  });
});

router.post('/edit/:roleId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.roleId;
  const permission=req.body.permission;
  const role=req.body.role;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');
    
    var singleInsert = 'update role_master set rm_name=$1, rm_description=$2, rm_updated_at=now() where rm_id=$3 RETURNING *',
        params = [role.rm_name,role.rm_description,id];
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        permission.forEach(function(value, key){
          
          if (value.rpm_add === true){
                value.rpm_add=1;
            }
            else{
                if(value.rpm_add == false){

                    value.rpm_add=0;
                }
            }
            if (value.rpm_edit === true){
                value.rpm_edit=1;
            }
            else{
                if(value.rpm_edit == false){
                value.rpm_edit=0; 
                }
            }

            if (value.rpm_delete === true){
                value.rpm_delete=1;
            }
            else{
                if(value.rpm_delete == false){
                value.rpm_delete=0; 
                }
            }
            if (value.rpm_list === true){
                value.rpm_list=1;
            }
            else{
                if(value.rpm_list == false){
                value.rpm_list=0; 
                }
            }
           client.query("update role_permission_master set rpm_add=$1, rpm_edit=$2, rpm_delete=$3, rpm_list=$4 where rpm_rm_id=$5 and rpm_pm_id=$6",[value.rpm_add,value.rpm_edit,value.rpm_delete,value.rpm_list,id,value.rpm_pm_id])
        });
        client.query('COMMIT;');
        done();
        return res.json(results);
    });

    done(err);
  });
});

router.post('/delete/:roleId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.roleId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');

    var singleInsert = 'update role_master set rm_status=1, rm_updated_at=now() where rm_id=$1 RETURNING *',
        params = [id]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        done();
        client.query('COMMIT;');
        return res.json(results);
    });

    done(err);
  });
});

router.post('/role/total', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const str = "%"+req.body.search+"%";

    console.log(str);
    const strqry =  "SELECT count(rm_id) as total "+
                    "from role_master "+
                    "where rm_status=0 "+
                    "and LOWER(rm_name||''||rm_description) LIKE LOWER($1);";

    const query = client.query(strqry,[str]);
    query.on('row', (row) => {
      results.push(row);
    });
    query.on('end', () => {
      done();
      // pg.end();
      return res.json(results);
    });
    done(err);
  });
});

router.post('/role/limit', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const str = "%"+req.body.search+"%";
    // SQL Query > Select Data

    const strqry =  "SELECT * "+
                    "from role_master rm "+
                    "where rm.rm_status=0 "+
                    "and LOWER(rm_name||''||rm_description) LIKE LOWER($1) "+
                    "order by rm.rm_id desc LIMIT $2 OFFSET $3";

    const query = client.query(strqry,[ str, req.body.number, req.body.begin]);
    query.on('row', (row) => {
      results.push(row);
    });
    query.on('end', () => {
      done();
      // pg.end();
      return res.json(results);
    });
    done(err);
  });
});

router.post('/typeahead/search', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const str = "%"+req.body.search+"%";
    // SQL Query > Select Data

    const strqry =  "SELECT * "+
                    "FROM role_master rm "+
                    "where rm.rm_status =0 "+
                    "and LOWER(rm_name) LIKE LOWER($1) "+
                    "order by rm.rm_id desc LIMIT 10";

    const query = client.query(strqry,[str]);
    query.on('row', (row) => {
      results.push(row);
    });
    query.on('end', () => {
      done();
      // pg.end();
      return res.json(results);
    });
    done(err);
  });
});

router.post('/permission/edit:permId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const role=req.body.role;
  const permission=req.body.permission;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    var singleInsert = "INSERT INTO role_master(rm_name, rm_description, rm_status) values($1,$2,0) RETURNING *",
        params = [role.rm_name,role.rm_description]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        permission.forEach(function(value, key){
          client.query('INSERT into role_permission_master(rpm_rm_id,rpm_pm_id,rpm_add,rpm_edit,rpm_delete,rpm_list) values($1,$2,$3,$4,$5,$6) RETURNING *',
            [result.rows[0].rm_id,value.pm_id,value.pm_add1,value.pm_edit1,value.pm_delete1,value.pm_list1]);
        });
        done();
        return res.json(results);
    });

    done(err);
  });
});

router.get('/view/:rmId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id=req.params.rmId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM role_permission_master rpm inner join permission_master pm on rpm.rpm_pm_id=pm.pm_id left outer join role_master rm on rpm.rpm_rm_id=rm.rm_id where rm_id=$1",[id]);
    query.on('row', (row) => {
      results.push(row);

    });
    query.on('end', () => {
      done();
      // pg.end();
      return res.json(results);
    });
  done(err);
  });
});

module.exports = router;