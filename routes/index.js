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
            name: "Hook列表",
            component: "OrderList/index",
          },
          {
            path: "/uploadbigfile",
            name: "上传大文件",
            component: "UploadBigFile/index",
          },
          {
            path: "/permission",
            name: "按钮权限",
            component: "Permission/index",
          },
          {
            path: "/virtuallist",
            name: "虚拟列表",
            component: "VirtualList/index",
          },
          {
            path: "/xydialog",
            name: "可拖动弹窗",
            component: "XYDialog/index",
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

// 提取文件名后缀
const extractExt = filename => {
  return filename.slice(filename.lastIndexOf('.'), filename.length)
}
router.post('/merge',async(req,res)=>{
  const { fileHash, fileName, size } = req.body
  // 如果存在该文件不需要再合并
  const filePath = path.resolve(UPLOAD_DIR, fileHash + extractExt(fileName))
  if (fse.existsSync(filePath)) {
    res.status(200).json({
      ok: true,
      msg:"文件已经存在，合并成功"
    })
    return
  }
  // 如果不存在就合并
  const chunkDir = path.resolve(UPLOAD_DIR, fileHash)
  if (!fse.existsSync(chunkDir)) {
    res.status(401).json({
      ok: false,
      msg:"文件不存在，合并失败"
    })
    return
  }
  // 合并操作
  const chunkPaths = await fse.readdir(chunkDir)
  chunkPaths.sort((a, b) => {
    return a.split('-')[1] - b.split('-')[1]
  })
  const list = chunkPaths.map((chunkName, index) => {
    return new Promise(resolve => {
      const chunkPath = path.resolve(chunkDir, chunkName)
      const readStream = fse.createReadStream(chunkPath)
      const writeStream = fse.createWriteStream(filePath, {
        start: index * size,
        end: (index + 1) * size
      })
      readStream.on('end', async () => {
        await fse.unlinkSync(chunkPath)
        resolve()
      })
      readStream.pipe(writeStream)
    })
  })
  await Promise.all(list)
  fse.remove(chunkDir)
  
  res.status(200).json({
    ok: true,
    msg:"文件合并成功"
  })
})

router.post("/verify",async (req, res) => {
  const { fileHash, fileName } = req.body
  const filePath = path.resolve(UPLOAD_DIR, fileHash + extractExt(fileName))
  // 返回服务器已经上传成功的切片
  const chunkDir = path.resolve(UPLOAD_DIR, fileHash)
  let chunkPaths = []
  if (fse.existsSync(chunkDir)) {
    chunkPaths = await fse.readdir(chunkDir)
  }
  // 如果存在就不需要上传
  if (fse.existsSync(filePath)){
    res.status(200).json({
      ok: true,
      shouldUpload: false
    })
  } else {
    res.status(200).json({
      ok: true,
      shouldUpload: true,
      existChunks:chunkPaths
    })
    
  }
})


router.get('/orderlist', function(req, res, next) {
  res.send({
    data:[
      {
        id:1,
        userName:"张三",
        telphone:"13812345678",
        orderTime:"2021-10-10 12:00:00",
        orderStatus:1,
        orderStatusText:"已支付",
        orderAmount:1357,
        orderNumber:"N9876282"
      },
      {
        id:2,
        userName:"李四",
        telphone:"13678943094",
        orderTime:"2021-10-11 13:30:00",
        orderStatus:1,
        orderStatusText:"已支付",
        orderAmount:3357.653,
        orderNumber:"T889123474"
      },
      {
        id:3,
        userName:"秀文",
        telphone:"13734534321",
        orderTime:"2022-07-03 11:24:00",
        orderStatus:0,
        orderStatusText:"未支付",
        orderAmount:980,
        orderNumber:"P98748123"
      },
      {
        id:4,
        userName:"少卿",
        telphone:"13867531345",
        orderTime:"2024-02-19 08:30:00",
        orderStatus:1,
        orderStatusText:"已支付",
        orderAmount:1372,
        orderNumber:"E8741293"
      }
    ]
  })
});

router.get('/skeleton', function(req, res, next) {
  setTimeout(() => {
    res.send({
      data:'加载完成'
    })
  }, 2000);
});
module.exports = router;
