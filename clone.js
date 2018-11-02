/*
    CLONE

    by Joshua A. Lemli
    2018
    
    JavaScript file
    */const CLONE_VERSION = "0.1.0";/*
    */const CLONE_RELEASE = "dev";/*
    */const CLONE_EDITION = "jailmate";/*
*/


"use strict";

const Clone = (function(){

    console.log(` \nCLONE v${CLONE_VERSION} [${CLONE_RELEASE}] "${CLONE_EDITION}"\n  by Joshua A. Lemli\n  2018\n `)

    var Artist = (function(){
        var canvas, context
        const init = () => {
            canvas = document.querySelector("#mainCanvas")
            context = canvas.getContext("2d")
            let resizeContext = () => {
                context.canvas.width = canvas.offsetWidth
                context.canvas.height = canvas.offsetHeight
                context.setTransform(20,0,0,-20,context.canvas.width/2,context.canvas.height/2)
                cloneMap.forEach( clone => clone.draw() )
            }
            resizeContext()
            window.addEventListener("resize",resizeContext)
        }
        return {
            init:init,
            fillRect: (xCenter,yCenter,xDim,yDim,color) => {
                context.fillStyle = color
                context.fillRect(xCenter-xDim/2,yCenter-yDim/2,xDim,yDim)
            },
            fillCircle: (x,y,r,color) => {
                context.fillStyle = color
                context.beginPath();
                context.arc(x,y,r,0,Math.PI*2)
                context.fill();
            }
        }
    })()

    var cloneMap = new Map()

    function Clone(xHash,yHash) {
        this.age = 0
        this.maxAge = 45
        this.fertileAge = 13
        this.cloningFailureChance = 0.96
        this.radius = this.maxRadius*0.95
        this.xHash = xHash
        this.yHash = yHash
        this.id = `${this.xHash.toString()}_${this.yHash.toString()}`
        this.yOdd = Math.abs(this.yHash%2) === 1 ? 1 : 0
        this.worldPosition = this.getWorldPosition()
        this._drawn = false
        this._color = `rgb(${Math.floor(Math.random()*100)},${Math.floor(Math.random()*100 + 75)},${Math.floor(Math.random()*150)})`
    }
    Clone.prototype.maxRadius = 0.5
    Clone.prototype.xMultiplier = Clone.prototype.maxRadius * 2
    Clone.prototype.yMultiplier = Math.sin(60/180*Math.PI) * Clone.prototype.xMultiplier
    Clone.prototype.xStagger = Clone.prototype.xMultiplier / 2
    Clone.prototype.getWorldPosition = function() {
        return {
            x: parseInt(this.xHash) * this.xMultiplier + this.yOdd*this.xStagger,
            y: parseInt(this.yHash) * this.yMultiplier
        }
    }
    Clone.prototype._randomPosition = () => Math.floor( Math.random() * 777 ) % 6
    Clone.prototype._getHashFromPosition = function(p) {
        var xHash,yHash
        switch(p) {
            case 0:
                xHash = this.xHash + 1
                yHash = this.yHash
                break
            case 1:
                xHash = this.xHash + this.yOdd
                yHash = this.yHash + 1
                break
            case 2:
                xHash = this.xHash - 1 + this.yOdd
                yHash = this.yHash + 1
                break
            case 3:
                xHash = this.xHash - 1
                yHash = this.yHash
                break
            case 4:
                xHash = this.xHash - 1 + this.yOdd
                yHash = this.yHash - 1
                break
            case 5:
                xHash = this.xHash + this.yOdd
                yHash = this.yHash - 1
                break
        }
        return {x:xHash,y:yHash}
    }
    Clone.prototype.clone = function(){
        var attempted = new Array(6).fill(0)
        var hash
        while (true) {
            var p = this._randomPosition()
            hash = this._getHashFromPosition(p) 
            if (cloneMap.has(`${hash.x.toString()}_${hash.y.toString()}`)) attempted[p] = 1
            else break
            if (!attempted.some(x=>x===0)) return null
        }
        let child = new Clone(hash.x,hash.y)
        cloneMap.set(child.id,child)
    }
    Clone.prototype.draw = function(){
        Artist.fillCircle(this.worldPosition.x,this.worldPosition.y,this.radius,this._color)
        this._drawn = true
    }
    Clone.prototype.step = function(){
        this.age += 1
        if (this.age > this.maxAge) return this.perish()
        if (this.age > this.fertileAge && Math.random() > this.cloningFailureChance) this.clone()
        if (!this._drawn) this.draw()
    }
    Clone.prototype.perish = function(){
        Artist.fillCircle(this.worldPosition.x,this.worldPosition.y,this.maxRadius,"#FFF")
        cloneMap.delete(this.id)
    }


    window.fail = false
    window.addEventListener("keydown",event=>window.fail=true)
    
    const step = () => {
        var tStart = performance.now()
        cloneMap.forEach( (value,key) => value.step() )
        if (Math.random() > 0.96) console.log(performance.now() - tStart)
        if (cloneMap.size === 0) cloneMap.set("0_0",new Clone(0,0))
        // loop
        if (!window.fail) window.requestAnimationFrame(step)
        else console.log("stopping")
    }

    return function() {
        Artist.init()

        //testing
        var one = new Clone(0,0)
        cloneMap.set(one.id,one)

        step()
    }

})()

window.onload = Clone
