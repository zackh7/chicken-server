var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
var pg = require('pg');
var path = require('path');
var config = require('../config.js');
var multer = require('multer');
var filenamestore = "";

var pool = new pg.Pool(config);

router.post('/forgot', (req, res, next) => {
  console.log(req.body);
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT emp_email_id FROM employee_master where emp_email_id=$1",[req.body.email]);
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

router.get('/:employeeId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.employeeId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT emp_name,emp_mobile,emp_address,emp_correspondence_address,emp_aadhar_no,emp_pancard_no,emp_designation,emp_emp_no,emp_email_id,emp_qualification,emp_image,emp_created_at,emp_updated_at,emp_status FROM employee_master where emp_id=$1',[id]);
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
  var Storage = multer.diskStorage({
      destination: function (req, file, callback) {
          // callback(null, "./images");
            callback(null, '../logichron/resources/images-new');
            
      },
      filename: function (req, file, callback) {
          var fi = file.fieldname + "_" + Date.now() + "_" + file.originalname;
          filenamestore = "../logichron/resources/images-new"+fi;
          callback(null, fi);
      }
  });

  var upload = multer({ storage: Storage }).array("imgUploader"); 
  
  upload(req, res, function (err) { 
    if (err) { 
        return res.end("Something went wrong!"+err); 
    } 
     
  });
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    var singleInsert = "INSERT INTO employee_master(emp_name, emp_mobile, emp_address, emp_correspondence_address, emp_aadhar_no, emp_pancard_no, emp_designation, emp_emp_no, emp_email_id, emp_qualification, emp_image, emp_status) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,0) RETURNING *",
        params = [req.body.emp_name,req.body.emp_mobile,req.body.emp_address,req.body.emp_correspondence_address,req.body.emp_aadhar_no,req.body.emp_pancard_no,req.body.emp_designation,req.body.emp_emp_no,req.body.emp_email_id,req.body.emp_qualification,filenamestore]
    client.query(singleInsert, params, function (error, result) {

        results.push(result.rows[0]); // Will contain your inserted rows
        done();
        return res.json(results);
    });

    done(err);
  });
});



router.post('/edit/:employeeId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.employeeId;
  var Storage = multer.diskStorage({
      destination: function (req, file, callback) {
          // callback(null, "./images");
            callback(null, "../logichron/resources/images-new");
      },
      filename: function (req, file, callback) {
          var fi = file.fieldname + "_" + Date.now() + "_" + file.originalname;
          filenamestore = "../logichron/resources/images-new/"+fi;
          callback(null, fi);
      }
  });

  var upload = multer({ storage: Storage }).array("emp_image"); 

  upload(req, res, function (err) { 
    if (err) { 
        return res.end("Something went wrong!"+err); 
    } 
    pool.connect(function(err, client, done){
      if(err) {
        done();
        console.log("the error is"+err);
        return res.status(500).json({success: false, data: err});
      }
      var singleInsert = 'update employee_master set emp_name=$1, emp_mobile=$2, emp_address=$3, emp_correspondence_address=$4, emp_aadhar_no=$5, emp_pancard_no=$6, emp_designation=$7, emp_emp_no=$8, emp_email_id=$9, emp_qualification=$10, emp_image=$11, emp_updated_at=now() where emp_id=$12 RETURNING *',
        params = [req.body.emp_name,req.body.emp_mobile,req.body.emp_address,req.body.emp_correspondence_address,req.body.emp_aadhar_no,req.body.emp_pancard_no,req.body.emp_designation,req.body.emp_emp_no,req.body.emp_email_id,req.body.emp_qualification,filenamestore,id];
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
          done();
          return res.json(results);
      });
      done(err);
    });
  }); 
});

router.post('/delete/:employeeId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.employeeId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');

    var singleInsert = "update employee_master set emp_status=1, emp_updated_at=now() where emp_id=$1 RETURNING *",
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

router.post('/employee/total', oauth.authorise(), (req, res, next) => {
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
    const strqry =  "SELECT count(emp_id) as total "+
                    "from employee_master "+
                    "where emp_status=0 "+
                    "and LOWER(emp_name||''||emp_mobile) LIKE LOWER($1);";

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

router.post('/employee/limit', oauth.authorise(), (req, res, next) => {
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
                    "FROM employee_master emp "+
                    "where emp.emp_status = 0 "+
                    "and LOWER(emp_name||''||emp_mobile) LIKE LOWER($1) "+
                    "order by emp.emp_id desc LIMIT $2 OFFSET $3";

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
                    "FROM employee_master emp "+
                    "where emp.emp_status = 0 "+
                    "and LOWER(emp_name||' '||emp_mobile) LIKE LOWER($1) "+
                    "order by emp.emp_id desc LIMIT 10";

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
module.exports = router;