module.exports = ()=>{
    return (err,req,res,next)=>{
        console.log(err.message)
        res.status(500).json({
            code: 1,
            msg: err.message
        })
    }
}