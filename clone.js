/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    CLONE - Automata html5+javascript game
    Copyright (C) 2018  Joshua A. Lemli

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.    

    

        C O N T A C T    I N F O R M A T I O N

            Joshua A. Lemli
            joshualemli@gmail.com



- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


    CLONE JavaScript file
    - - - - - - - - - - - - - - - - - - - */
        const
        CLONE_VERSION = "0.1.1",
        CLONE_RELEASE = "dev",
        CLONE_EDITION = "jailhouse rock";
    /* - - - - - - - - - - - - - - - - - - -


*/


"use strict";

console.log(` \nCLONE v${CLONE_VERSION} [${CLONE_RELEASE}] "${CLONE_EDITION}" edtion\n \n  by Joshua A. Lemli\n  2018\n `)

const CLONE_Game = (function(){

    var cloneMap = new Map()

    var view = {
        scale:4,
        xPos:0,
        yPos:0,
        bounds: {},
        screenSize: {}
    }

    var game = {
        steps:0,
        points:0,
        clonesCreated:0,
        pause:false
    }

    
    const setLayout = layout => {
        // document.getElementById("mainCanvas").classList = layout==="gameplay" ? "size-full" : "size-twoRow"
        // document.getElementById("cloneUI").classList = layout==="gameplay" ? "occlude" : "size-twoRow"
        Artist.resize()
    }

    var Input = (function(){
        var bindings = {
            "=" : "zoomIn",
            "-" : "zoomOut",
            "ArrowUp" : "panUp",
            "ArrowDown" : "panDown",
            "ArrowLeft" : "panLeft",
            "ArrowRight" : "panRight",
            " " : "pause",
            "0" : "recenterView"
        }
        var state = {}
        const toggle = action => {
            switch(action) {
                case "pause":
                    game.pause = !game.pause
                    break
                case "recenterView":
                    view.xPos = view.yPos = 0
                    view.scale = 4
                    Artist.redraw()
                    break
            }
        }
        const apply = () => {
            // zoom
            if (state.zoomIn) view.scale *= 1.02
            else if (state.zoomOut) view.scale *= 0.98
            // pan
            if (state.panUp) view.yPos += 4 / view.scale
            else if (state.panDown) view.yPos -= 4 / view.scale
            if (state.panLeft) view.xPos -= 4 / view.scale
            else if (state.panRight) view.xPos += 4 / view.scale
            // redraw
            if (state.zoomIn||state.zoomOut||state.panUp||state.panDown||state.panLeft||state.panRight) Artist.redraw()
        }
        const init = function(){
            window.addEventListener("keyup", event => state[bindings[event.key]] = false)
            window.addEventListener("keydown", event => {
                let action = bindings[event.key]
                state[action] = true
                toggle(action)
            })
            document.querySelector("#mainCanvas").addEventListener("mousedown", event => {
                let x = (event.offsetX - view.screenSize.x/2) / view.scale + view.xPos
                let y = (view.screenSize.y/2 - event.offsetY) / view.scale + view.yPos
                let yHash = Math.round(y / Clone.prototype.yMultiplier)
                let yOdd = yHash % 2 !== 0 ? Clone.prototype.xStagger : 0
                let xHash = Math.round((x - yOdd) / Clone.prototype.xMultiplier)
                let id = `${xHash}_${yHash}`
                let clone = cloneMap.has(id)
                if (clone) {
                    game.pause = true
                    CloneUI.load(id)
                    setLayout("cloneUI")
                }
            })
            // document.querySelector("#mainCanvas").addEventListener("mousemove", event => null)
            document.querySelector("#mainCanvas").addEventListener("wheel", event => {
                if (event.deltaY) {
                    if (Math.sign(event.deltaY) < 0) view.scale *= 1.1
                    else view.scale *= 0.9
                    Artist.redraw()
                }
            })
        }
        return {
            init : init,
            apply : apply
        }
    })()

    var Artist = (function(){
        var canvas, context
        const resize = () => {
            canvas.width = canvas.parentElement.offsetWidth
            canvas.height = canvas.parentElement.offsetHeight
            context.canvas.width = view.screenSize.x = canvas.offsetWidth
            context.canvas.height = view.screenSize.y = canvas.offsetHeight
            redraw()
        }
        const redraw = () => {
            context.setTransform(1,0,0,1,0,0)
            context.clearRect(0,0,context.canvas.width,context.canvas.height)
            context.setTransform(view.scale,0,0,-view.scale, context.canvas.width/2 - view.xPos*view.scale, context.canvas.height/2 + view.yPos*view.scale)
            Artist.setBounds()
            cloneMap.forEach( clone => clone.draw() )
        }
        const init = () => {
            canvas = document.querySelector("#mainCanvas")
            context = canvas.getContext("2d")
            window.addEventListener("resize",resize)
        }
        return {
            init : init,
            redraw : redraw,
            resize : resize,
            setBounds: () => {
                let xOffset = context.canvas.width / view.scale / 2
                let yOffset = context.canvas.height / view.scale / 2
                view.bounds = {
                    xMin: view.xPos - xOffset,
                    xMax: view.xPos + xOffset,
                    yMin: view.yPos - yOffset,
                    yMax: view.yPos + yOffset,
                }
            },
            fillRect: (xCenter,yCenter,xDim,yDim,color) => {
                context.fillStyle = color
                context.fillRect(xCenter-xDim/2,yCenter-yDim/2,xDim,yDim)
            },
            fillCircle: (x,y,r,color) => {
                context.fillStyle = color
                context.beginPath()
                context.arc(x,y,r,0,Math.PI*2)
                context.fill()
            }
        }
    })()

    const CloneUI = (function() {
        var uiContainer, statisticsContainer, attributesContainer
        const createHtmlElement = (type,options,styles) => {
            var key, e = document.createElement(type)
            if (options) for (key in options) e[key] = options[key]
            if (styles) for (key in styles) e.style[key] = styles[key]
            return e
        }
        const _reset = () => {
            while (uiContainer.firstElementChild) uiContainer.removeChild(uiContainer.firstElementChild)
            uiContainer.appendChild(createHtmlElement("div",{
                id:"cloneUI-statistics", className:"cloneUI-section",
                innerHTML:`<div class="cloneUI-section-label">Statistics</div>`
            }))
            uiContainer.appendChild(createHtmlElement("div",{
                id:"cloneUI-attributes", className:"cloneUI-section",
                innerHTML:`<div class="cloneUI-section-label">Attributes</div>`
            }))
            statisticsContainer = uiContainer.children[0]
            attributesContainer = uiContainer.children[1]
        }
        const statistic = (name,value) => {
            let e = createHtmlElement("div",{className:"cloneUI-statistic",innerHTML:`<div>${name}</div><div>${value}</div>`})
            statisticsContainer.appendChild(e)
            return e
        }
        const attribute = (name,value) => {

        }
        const item = () => {}
        return {
            init : () => {
                uiContainer = document.querySelector("#cloneUI")
            },
            load : id => {
                let clone = cloneMap.get(id)
                console.log(clone)
                _reset()
                statistic("Age",clone.age)
                statistic("Max age",clone.maxAge)
                Artist.resize()
            }
        }
    })()

    function Clone(xHash,yHash,override) {
        override = override || {}
        this.age = 0
        this.maxAge = override.maxAge || 31
        this.fertileAge = override.fertileAge || 7
        this.cloningFailureChance = override.cloningFailureChance || 0.95
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
    Clone.prototype._randomPosition = () => Math.floor( Math.random() * 7771 ) % 6
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
        if (
            this.worldPosition.x + this.radius > view.bounds.xMin &&
            this.worldPosition.x - this.radius < view.bounds.xMax &&
            this.worldPosition.y + this.radius > view.bounds.yMin &&
            this.worldPosition.y - this.radius < view.bounds.yMax
        ) {
            Artist.fillCircle(this.worldPosition.x,this.worldPosition.y,this.radius,this._color)
        }
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

    
    const step = () => {
        // start microtime
        var tStart = performance.now()
        // input
        Input.apply()
        if (!game.pause) {
            // perform `step` for each clone
            cloneMap.forEach( (value,key) => value.step() )
            // create a new clone if the `cloneMap` is empty
            if (cloneMap.size === 0) {
                var one = new Clone(0,0)
                cloneMap.set(one.id,one)
            }
        }
        // debug: frame time
        if (Math.random() > 0.99) console.log(performance.now() - tStart)
        // loop
        window.requestAnimationFrame(step)
    }

    return function() {
        CloneUI.init()
        Artist.init()
        Input.init()
        setLayout("gameplay")
        step()
    }

})()

window.onload = CLONE_Game
