<template>
<div class="container">
    <div class="item">
      <img src="../../assets/1.jpg" alt="" />
    </div>
    <div class="item">
      <img src="../../assets/2.jpg" alt="" />
    </div> <div class="item">
      <img src="../../assets/3.jpg" alt="" />
    </div> <div class="item">
      <img src="../../assets/4.jpg" alt="" />
    </div> <div class="item">
      <img src="../../assets/5.jpg" alt="" />
    </div>
</div>
</template>

<style scoped>
.container{
  width:250px;
  height:250px;
  margin: 0 auto;
  margin-top: 100px;
  display: grid;
  grid-template-rows: repeat(3,1fr);
  grid-template-columns: repeat(3,1fr);
  gap:10px;
  grid-template: 
  'A A B'
  'C D B'
  'C E E'; 
}
.item:nth-child(1){
  grid-area: A;
}
.item:nth-child(2){
  grid-area: B; 
} 
.item:nth-child(3){
  grid-area: C;
}
.item:nth-child(5){
  grid-area: D; 
}
.item:nth-child(4){
  grid-area: E; 
}
.item{
  overflow: hidden;
  border: solid 1px #000;
  display: flex;
  justify-content: center;
  align-items: center
 
}
.item img {
  width: 250%;
  height: 330%;
  object-fit: cover; /* 保持图片比例 */
}
.container{
  animation: rotation 10s infinite linear;
}
.item img{
  animation: rotation 10s infinite linear reverse;
}
@keyframes rotation{
  to{
    transform: rotate(360deg);
  }
}
</style>