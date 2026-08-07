export class Memory{
  constructor(){
    this.equation=[];
    this.answer=[];
  }
  push(equ,ans){
    this.equation.push(equ)
    this.answer.push(ans)
  }
}