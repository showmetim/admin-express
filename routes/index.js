var express = require('express');
var router = express.Router();
var path = require('path');
const multiparty = require('multiparty');
const fse = require('fs-extra');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/routers', function(req, res, next) {
  res.send({
    routers:[
      {
        name: "首页",
        path: "/homepage",
        component: "HomePage",
        children: [],
      },
      {
        component: "Layout",
        name: "功能",
        path:'/utils',
        children: [
          {
            path: "/orderlist",
            name: "列表",
            component: "OrderList",
          },
          {
            path: "/uploadbigfile",
            name: "上传大文件",
            component: "UploadBigFile/index",
          },
          {
            path: "/ceshi",
            name: "测试",
            component: "Ceshi",
            meta:{
              keepAlive:true
            }
          },
        ],
      },
    ]
  })
});

const UPLOAD_DIR = path.resolve(path.dirname(__dirname), 'uploads')
router.post('/upload',function(req,res){
  const form = new multiparty.Form()

  form.parse(req,async(err,fields,files)=>{
    if(err){
      res.status(401).json({
        ok: false,
        msg:"文件上传失败"
      })
      return
    }
    const fileHash = fields['fileHash'][0]
    const chunkHash = fields['chunkHash'][0]
    // 临时存放目录
    const chunkPath = path.resolve(UPLOAD_DIR, fileHash)
    // 没有就新建
    if(!fse.existsSync(chunkPath)){
      await fse.mkdir(chunkPath)
    }
    const oldPath = files['chunk'][0]['path']
    // 将切片放到这个文件夹中
    await fse.move(oldPath, path.resolve(chunkPath, chunkHash))
    res.status(200).json({
      ok: true,
      msg:"文件上传成功"
    })
  })
})

module.exports = router;
