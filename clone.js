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
        CLONE_VERSION = "0.1.3",
        CLONE_RELEASE = "dev",
        CLONE_EDITION = "jailhouse rock";
    /* - - - - - - - - - - - - - - - - - - -


*/


"use strict";

console.log(` \nCLONE v${CLONE_VERSION} [${CLONE_RELEASE}] "${CLONE_EDITION}" edition\n \n  by Joshua A. Lemli\n  2018\n `)

const CLONE_Game = (function(){


    // STATE DATA


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
        resources:0,
        clonesCreated:0,
        items:{
            genesisPod: 15,
            genesisRay: 1,
            smitingBolt: 1,
        },
        artifacts:[],
        pause:false,
        worldRadius:5
    }



    //DEBUG:
    window.gg = () => console.log(game)


    // MACROS


    const createHtmlElement = (type,options,styles) => {
        var key, e = document.createElement(type)
        if (options) for (key in options) e[key] = options[key]
        if (styles) for (key in styles) e.style[key] = styles[key]
        return e
    }


    // MODULES


    const Framerate = (function(){
        var count, start
        return {
            reset: () => {
                count = 0
                start = performance.now()
            },
            fps: () => Math.round(count / (performance.now() - start) * 1000),
            microtime: () => (performance.now() - start) / count,
            register: () => {
                count += 1
            },
        }
    })()


    var Input = (function(){
        
        var clickMode = 0 // 0=inspect, 1=useItem

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
                    if (!game.pause) CloneUI.load()
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
            // keyboard input
            window.addEventListener("keyup", event => state[bindings[event.key]] = false)
            window.addEventListener("keydown", event => {
                let action = bindings[event.key]
                state[action] = true
                toggle(action)
            })
            // clicking on the world
            document.querySelector("#mainCanvas").addEventListener("mousedown", event => {
                let x = (event.offsetX - view.screenSize.x/2) / view.scale + view.xPos
                let y = (view.screenSize.y/2 - event.offsetY) / view.scale + view.yPos
                if (Math.sqrt(x*x+y*y) > game.worldRadius) return console.log("click out of world bounds")
                let yHash = Math.round(y / Clone.prototype.yMultiplier)
                let yOdd = yHash % 2 !== 0 ? Clone.prototype.xStagger : 0
                let xHash = Math.round((x - yOdd) / Clone.prototype.xMultiplier)
                // 0=inspect, 1=useItem
                switch (clickMode) {
                    case 0:
                        let id = `${xHash}_${yHash}`
                        if (cloneMap.has(id)) CloneUI.load(id)
                        break
                    case 1:
                        let item = Menu.getSelectedItem()
                        if (item && Items[item].use(xHash,yHash)) {
                            game.items[item] -= 1
                            if (game.items[item] === 0) {
                                clickMode = 0
                                Menu.refresh()
                            }
                            else Items[item].menuCountElement.innerHTML = game.items[item]
                        }
                        break
                }
            })
            // zooming in on the world (changing `view.scale`) with mouse wheel
            document.querySelector("#mainCanvas").addEventListener("wheel", event => {
                if (event.deltaY) {
                    view.scale *= (Math.sign(event.deltaY) < 0 ? 1.1 : 0.9)
                    Artist.redraw()
                }
            })
        }
        return {
            init : init,
            apply : apply,
            setClickMode : n => clickMode = n
        }
    })()


    var Artist = (function(){
        var canvas, context
        const redraw = () => {
            context.setTransform(1,0,0,1,0,0)
            context.clearRect(0,0,context.canvas.width,context.canvas.height)
            context.setTransform(view.scale,0,0,-view.scale, context.canvas.width/2 - view.xPos*view.scale, context.canvas.height/2 + view.yPos*view.scale)
            Artist.setBounds()
            Artist.outlineCircle(0, 0, game.worldRadius + Clone.prototype.maxRadius*2, "#F00", 0.2)
            cloneMap.forEach( clone => clone.draw() )
        }
        const resize = () => {
            canvas.width = canvas.parentElement.offsetWidth
            canvas.height = canvas.parentElement.offsetHeight
            context.canvas.width = view.screenSize.x = canvas.offsetWidth
            context.canvas.height = view.screenSize.y = canvas.offsetHeight
            redraw()
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
            outlineCircle: (x,y,r,color,width) => {
                context.strokeStyle = color
                context.lineWidth = width
                context.beginPath()
                context.arc(x,y,r,0,Math.PI*2)
                context.stroke()
            },
            fillCircle: (x,y,r,color) => {
                context.fillStyle = color
                context.beginPath()
                context.arc(x,y,r,0,Math.PI*2)
                context.fill()
            }
        }
    })()


    const Menu = (function(){
        var itemsContainer, selectedItem
        var stats = {}
        const refresh = () => {
            // clear items
            selectedItem = null
            while (itemsContainer.firstElementChild) itemsContainer.removeChild(itemsContainer.firstElementChild)
            // build items
            for (let key in game.items) if (game.items[key] > 0) {
                let itemContainer = createHtmlElement("div",{
                    className: "menu-items-item",
                    innerHTML: `<div>${Items[key].name}</div><div>${game.items[key]}</div>`,
                })
                itemContainer.onclick = function(event) {
                    document.querySelectorAll(".menu-items-selectedItem").forEach( e => e.classList.remove("menu-items-selectedItem") )
                    if (selectedItem === key) {
                        selectedItem = null
                        Input.setClickMode(0)
                    }
                    else {
                        selectedItem = key
                        Input.setClickMode(1)
                        itemContainer.classList.add("menu-items-selectedItem")
                    }
                }
                itemsContainer.appendChild(itemContainer)
                Items[key].menuContainerElement = itemContainer
                Items[key].menuCountElement = itemContainer.children[1]
            }
        }
        const updateStats = () => {
            var production = 0
            cloneMap.forEach( clone => production += clone.production )
            production *= Framerate.fps()
            stats.resources.innerHTML = game.resources.toFixed(3)
            stats.production.innerHTML = production.toFixed(3) + "/s"
            stats.clones.innerHTML = cloneMap.size
            stats.clonesCreated.innerHTML = game.clonesCreated
        }
        return {
            init : () => {
                itemsContainer = document.querySelector("#menu-items")
                new Array("resources","production","clones","clonesCreated").forEach( idPart => stats[idPart] = document.querySelector(`#menu-stats-${idPart}`) )
                document.getElementById("menu-openShop").onclick = () => {
                    game.pause = true
                    document.getElementById("store").classList.remove("occlude")
                }
            },
            refresh : refresh,
            updateStats : updateStats,
            getSelectedItem : () => selectedItem
        }
    })()


    const CloneUI = (function() {
        var uiContainer, statisticsContainer, attributesContainer
        const resetElements = () => {
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
            load : (id) => {
                while (uiContainer.firstElementChild) uiContainer.removeChild(uiContainer.firstElementChild)
                if (id) {
                    game.pause = true
                    resetElements()
                    var clone = cloneMap.get(id)
                    view.xPos = clone.worldPosition.x
                    view.yPos = clone.worldPosition.y
                    statistic("Age",clone.age)
                    statistic("Max age",clone.maxAge)
                    statistic("Fertile age",clone.fertileAge)
                    statistic("Cloning success rate", ((1 - clone.cloningFailureChance) * 100).toFixed(1) + "%")
                }
                Artist.resize()
            }
        }
    })()


    // CLONE CLASS

    function Clone(xHash,yHash,override) {
        override = override || {}
        this.age = 0
        this.maxAge = override.maxAge || 40
        this.fertileAge = override.fertileAge || 20
        this.cloningFailureChance = override.cloningFailureChance || 0.975
        this.production = override.production || 0.01
        this.lifetimeProduction = 0
        this.radius = this.maxRadius*0.7
        this.xHash = xHash
        this.yHash = yHash
        this.id = `${this.xHash.toString()}_${this.yHash.toString()}`
        this.yOdd = Math.abs(this.yHash%2) === 1 ? 1 : 0
        this.worldPosition = this.getWorldPosition()
        this._drawn = false
        this._color = `rgb(${Math.floor(Math.random()*100)},${Math.floor(Math.random()*100 + 75)},${Math.floor(Math.random()*150)})`
        // this._color = `rgb(${Math.floor(Math.random()*255)},${Math.floor(Math.random()*125 + 75)},${Math.floor(Math.random()*255)})`
        // make sure this is in world bounds
        if (Math.sqrt(this.worldPosition.x*this.worldPosition.x+this.worldPosition.y*this.worldPosition.y) > game.worldRadius) {
            delete this.id
            return null
        }
        else {
            cloneMap.set(this.id,this)
            game.clonesCreated += 1
        }
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
        new Clone(hash.x,hash.y)
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
        // aging
        this.age += 1
        if (this.age > this.maxAge) return this.perish()
        // clone self
        if (this.age > this.fertileAge && Math.random() > this.cloningFailureChance) return this.clone()
        // production
        game.resources += this.production
        this.lifetimeProduction += this.production
        // graphics
        if (!this._drawn) this.draw()
    }
    Clone.prototype.perish = function(){
        Artist.fillCircle(this.worldPosition.x,this.worldPosition.y,this.maxRadius,"#FFF")
        cloneMap.delete(this.id)
    }


    // ITEMS
    const Items = {
        genesisPod: {
            use: (xHash,yHash) => {
                let id = `${xHash}_${yHash}`
                if (!cloneMap.has(id)) {
                    let clone = new Clone(xHash,yHash)
                    if (clone.id) {
                        if (game.pause) clone.draw()
                        return true
                    }
                }
                return false
            },
            name: "Genesis Pod",
            icon: "1_20"
        },
        genesisRay: {
            use: (xHash,yHash) => {
                var xShift,yShift,id,clone
                new Array([0,2],[-1,1],[0,1],[1,1],[-2,0],[-1,0],[0,0],[1,0],[2,0],[-1,-1],[0,-1],[1,-1],[0,-2]).forEach( coord => {
                    xShift = xHash + coord[0]
                    yShift = yHash + coord[1]
                    id = `${xShift}_${yShift}`
                    if (!cloneMap.has(id)) {
                        clone = new Clone(xShift,yShift)
                        if (game.pause && clone.id) clone.draw()
                    }
                })
                return true
            },
            name: "Genesis Ray",
            icon: "1_20"
        },
        smitingBolt: {
            use: (xHash,yHash) => {
                let clone = cloneMap.get(`${xHash}_${yHash}`)
                if (clone) {
                    clone.perish()
                    return true
                }
                return false
            },
            name: "Smiting Bolt"
        },
    }
    // ARTIFACTS



    // GAMEPLAY LOOP

    
    const step = () => {
        // register this frame for FPS timer
        Framerate.register()
        // input
        Input.apply()
        // clones
        if (!game.pause) {
            game.steps += 1
            cloneMap.forEach( (value,key) => value.step() )
        }
        // debug: frame time
        if (game.steps % 60 === 0) {
            Menu.updateStats()
            Framerate.reset()
        }
        // loop
        window.requestAnimationFrame(step)
    }


    return function() {
        // initialization
        CloneUI.init()
        Artist.init()
        Input.init()
        Menu.init()
        // start gameplay
        Artist.resize()
        Menu.refresh()
        Framerate.reset()
        step()
    }

})()

window.onload = CLONE_Game


