var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
var pg = require('pg');
var path = require('path');
var config = require('../config.js');

var pool = new pg.Pool(config);

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
    const query = client.query("SELECT pm_id,pm_name,pm_add,pm_edit,pm_delete,pm_list,pm_status,pm_created_at,pm_updated_at FROM permission_master where pm_status=0 order by pm_id asc");
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
    const query = client.query("SELECT rpm_rm_id,rpm_pm_id,rpm_add,rpm_edit,rpm_delete,rpm_list,pm_name,pm_add,pm_edit,pm_delete,pm_list,pm_status,pm_created_at,pm_updated_at,rm_name,rm_description,rm_status,rm_updated_at,rm_created_at FROM role_permission_master rpm inner join permission_master pm on rpm.rpm_pm_id=pm.pm_id left outer join role_master rm on rpm.rpm_rm_id=rm.rm_id where rm_id=$1",[id]);
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
          client.query("update role_permission_master set rpm_add=$1, rpm_edit=$2, rpm_delete=$3, rpm_list=$4 where rpm_rm_id=$5 RETURNING *",[value.pm_add1,value.pm_edit1,value.pm_delete1,value.pm_list1,result.rows[0].rm_id])
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



module.exports = router;