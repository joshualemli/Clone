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
        CLONE_VERSION = "0.2.0",
        CLONE_RELEASE = "dev",
        CLONE_EDITION = "masumune calls";
    /* - - - - - - - - - - - - - - - - - - -


*/


"use strict";

console.log(` \nCLONE v${CLONE_VERSION} [${CLONE_RELEASE}] "${CLONE_EDITION}" edition\n \n  by Joshua A. Lemli\n  2018\n `)

const CLONE_Game = (function(){


    // STATE DATA

    var view, game, cloneMap, spriteMap


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
        
        var enabled = false, clickMode = 0

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
                    CloneUI.load()
                    break
                case "recenterView":
                    view.xPos = view.yPos = 0
                    view.scale = 7
                    Artist.redraw()
                    break
                
            }
        }
        const apply = () => {
            // zoom
            if (state.zoomIn) view.scale *= 1.02
            else if (state.zoomOut) view.scale *= 0.98
            // pan
            if (state.panUp) view.yPos += 5 / view.scale
            else if (state.panDown) view.yPos -= 5 / view.scale
            if (state.panLeft) view.xPos -= 5 / view.scale
            else if (state.panRight) view.xPos += 5 / view.scale
            // redraw
            if (state.zoomIn||state.zoomOut||state.panUp||state.panDown||state.panLeft||state.panRight) Artist.redraw()
        }
        const keyupHandler = event => state[bindings[event.key]] = false
        const keydownHandler = event => {
            let action = bindings[event.key]
            state[action] = true
            toggle(action)
        }
        const mainCanvasMouseDownHandler = event => {
            let x = (event.offsetX - view.screenSize.x/2) / view.scale + view.xPos
            let y = (view.screenSize.y/2 - event.offsetY) / view.scale + view.yPos
            if (Math.sqrt(x*x+y*y) > game.worldRadius) return console.log("click out of world bounds")
            let yHash = Math.round(y / Clone.prototype.yMultiplier)
            let yOdd = yHash % 2 !== 0 ? Clone.prototype.xStagger : 0
            let xHash = Math.round((x - yOdd) / Clone.prototype.xMultiplier)
            switch (clickMode) {
                case 0: // Inspect
                    let id = `${xHash}_${yHash}`
                    if (cloneMap.has(id)) CloneUI.load(id)
                    break
                case 1: // Use Item
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
        }
        const mainCanvasMouseWheelHandler = event => {
            if (event.deltaY) {
                view.scale *= (Math.sign(event.deltaY) < 0 ? 1.1 : 0.9)
                Artist.redraw()
            }
        }
        const enable = () => {
            if (enabled) return null
            else enabled = true
            window.addEventListener("keyup", keyupHandler)
            window.addEventListener("keydown", keydownHandler)
            document.querySelector("#mainCanvas").addEventListener("mousedown", mainCanvasMouseDownHandler)
            document.querySelector("#mainCanvas").addEventListener("wheel", mainCanvasMouseWheelHandler)
        }
        const disable = () => {
            if (!enabled) return null
            else enabled = false
            window.removeEventListener("keyup", keyupHandler)
            window.removeEventListener("keydown", keydownHandler)
            document.querySelector("#mainCanvas").removeEventListener("mousedown", mainCanvasMouseDownHandler)
            document.querySelector("#mainCanvas").removeEventListener("wheel", mainCanvasMouseWheelHandler)
        }

        return {
            enable : enable,
            disable : disable,
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
            cloneMap.forEach( clone => clone.draw() )
            spriteMap.forEach( sprite => sprite.draw() )
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
            outlineCircle: (x,y,r,width,color) => {
                context.strokeStyle = color
                context.lineWidth = width
                context.beginPath()
                context.arc(x,y,r,0,2*Math.PI,false)
                context.stroke()
            },
            fillCircle: (x,y,r,color) => {
                context.fillStyle = color
                context.beginPath()
                context.arc(x,y,r,0,2*Math.PI,false)
                context.fill()
            },
            clipCircle: (x,y,r) => {
                context.save()
                context.beginPath()
                context.arc(x,y,r,0,2*Math.PI,false)
                context.clip()
                context.clearRect(x - r - 1, y - r - 1, r * 2 + 2, r * 2 + 2)
                context.restore()
            }
        }
    })()

    
    const Store = (function(){
        var order, details, container
        const open = () => {
            order = {
                items: [],
                augmentations: [],
                artifacts: []
            }
            game.pause = true
            container.classList.remove("occlude")
            Input.disable()
        }
        const cancel = () => {
            Input.enable()
        }
        const confirm = () => {
            Input.enable()

        }
        const init = () => {
            container = document.getElementById("store")
            details = {
                container: document.getElementById("store-itemDetails"),
                itemsContainer: document.getElementById("store-section-items"),
                augmentationsContainer: document.getElementById("store-section-augmentations"),
                artifactsContainer: document.getElementById("store-section-artifacts"),
            }
            new Array("icon","name","details","quanity","cost").forEach( idPart => details[idPart] = document.getElementById(`store-itemDetails-${idPart}`) )
            document.getElementById("store-itemDetails-minusTen").onclick = event => {}
            document.querySelectorAll(".store-merchandiseItem").forEach( e => e.onclick = event => {
                let type = event.target.dataset.type
                let key = event.target.dataset.key
            })
            var key,elem
            for (key in Items) {
                elem = createHtmlElement("div",{className:"store-merchandiseItem"})
                elem.dataset.key = key
                elem.dataset.type = "item"
                elem.appendChild(createHtmlElement("div",{className:"store-merchandiseItem-icon"}))
                elem.appendChild(createHtmlElement("div",{className:"store-merchandiseItem-name",innerHTML:Items[key].name}))
            }
        }
        return {
            init : init,
            open : open,
            cancel : cancel,
            confirm : confirm
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
            stats.clones.innerHTML = game.livingClones
            stats.lifetimeClones.innerHTML = game.lifetimeClones
            stats.mutantClones.innerHTML = game.livingMutantClones
            stats.lifetimeMutantClones.innerHTML = game.lifetimeMutantClones
            stats.foreignClones.innerHTML = game.livingForeignClones
            stats.lifetimeForeignClones.innerHTML = game.lifetimeForeignClones
        }
        return {
            init : () => {
                itemsContainer = document.querySelector("#menu-items")
                new Array(
                    "resources","production","clones","lifetimeClones","mutantClones","lifetimeMutantClones","foreignClones","lifetimeForeignClones"
                ).forEach( idPart => stats[idPart] = document.querySelector(`#menu-stats-${idPart}`) )
                document.getElementById("menu-openShop").onclick = Store.open
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
                id:"cloneUI-attributes", className:"cloneUI-section"
            }))
            attributesContainer = uiContainer.children[0]
            uiContainer.appendChild(createHtmlElement("div",{
                id:"cloneUI-statistics", className:"cloneUI-section"
            }))
            statisticsContainer = uiContainer.children[1]
        }
        const attribute = (name,value) => {
            let e = createHtmlElement("div",{className:"cloneUI-attribute",innerHTML:`<div>${name}</div><div>${value}</div>`})
            attributesContainer.appendChild(e)
            return e
        }
        const statistic = (name,value) => {
            let e = createHtmlElement("div",{className:"cloneUI-statistic",innerHTML:`<div>${name}</div><div>${value}</div>`})
            statisticsContainer.appendChild(e)
            return e
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
                    new Sprites.cloneHighlight(clone)
                    view.xPos = clone.worldPosition.x
                    view.yPos = clone.worldPosition.y
                    attribute("Name",clone.name)
                    attribute("Age",clone.age)
                    attribute("Generation",clone.generation)
                    attribute("Max age",clone.maxAge)
                    attribute("Fertile age",clone.fertileAge)
                    attribute("Cloning success rate", ((1 - clone.cloningFailureChance) * 100).toFixed(1) + "%")
                    attribute("Lifetime production", clone.lifetimeProduction.toFixed(3))
                }
                Artist.resize()
            }
        }
    })()


    // CLONE CLASS
    
    function Clone(xHash,yHash,override) {
        override = override || {}
        this.name = [
            this.nameLexicon.FIRST[Math.floor(Math.random()*this.nameLexicon.FIRST.length)],
            this.nameLexicon.MIDDLE[Math.floor(Math.random()*this.nameLexicon.MIDDLE.length)],
            this.nameLexicon.LAST[Math.floor(Math.random()*this.nameLexicon.LAST.length)]
        ].join(" ")
        this.age = 0
        this.generation = override.generation || 1
        this.maxAge = override.maxAge || 50
        this.fertileAge = override.fertileAge || 20
        this.cloningFailureChance = override.cloningFailureChance || 0.96
        // type
        this.mutant = override.mutant ? true : (Math.random()>0.999 && this.generation > 1 ? true : false)
        this.foreign = override.foreign || false
        // production
        this.production = (this.mutant||this.foreign) ? 0 : (override.production || 0.01)
        this.lifetimeProduction = 0
        this.radius = this.maxRadius*0.7
        this.xHash = xHash
        this.yHash = yHash
        this.id = `${this.xHash.toString()}_${this.yHash.toString()}`
        this.yOdd = Math.abs(this.yHash%2) === 1 ? 1 : 0
        this.worldPosition = this.getWorldPosition()
        this._drawn = false
        if (!this.mutant && !this.foreign) this._color = `rgb(${Math.floor(Math.random()*20)},${Math.floor(Math.random()*125 + 100)},${Math.floor(Math.random()*80)})`
        else if (this.mutant) this._color = `rgb(${Math.floor(Math.random()*100+50)},${Math.floor(Math.random()*20)},${Math.floor(Math.random()*100+100)})`
        else if (this.foreign) this._color = `rgb(${Math.floor(Math.random()*125+125)},${Math.floor(Math.random()*20)},${Math.floor(Math.random()*20)})`
        // make sure this is in world bounds
        if (Math.sqrt(this.worldPosition.x*this.worldPosition.x+this.worldPosition.y*this.worldPosition.y) > game.worldRadius) {
            delete this.id
            return null
        }
        else {
            if (this.mutant) {
                game.livingMutantClones += 1
                game.lifetimeMutantClones += 1
            }
            else if (this.foreign) {
                game.livingForeignClones += 1
                game.lifetimeForeignClones += 1
            }
            else {
                game.livingClones += 1
                game.lifetimeClones += 1
            }            cloneMap.set(this.id,this)
            this.draw()
        }
    }
    Clone.prototype.nameLexicon = CLONE_NAMES
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
            case 0: xHash = this.xHash + 1;             yHash = this.yHash;     break;
            case 1: xHash = this.xHash + this.yOdd;     yHash = this.yHash + 1; break;
            case 2: xHash = this.xHash - 1 + this.yOdd; yHash = this.yHash + 1; break;
            case 3: xHash = this.xHash - 1;             yHash = this.yHash;     break;
            case 4: xHash = this.xHash - 1 + this.yOdd; yHash = this.yHash - 1; break;
            case 5: xHash = this.xHash + this.yOdd;     yHash = this.yHash - 1; break;
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
        new Clone(hash.x, hash.y, {
            generation: this.generation+1,
            mutant: this.mutant,
            foreign: this.foreign
        })
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
    }
    Clone.prototype.perish = function(){
        Artist.clipCircle(this.worldPosition.x,this.worldPosition.y,this.maxRadius)
        if (this.mutant) game.livingMutantClones -= 1
        else if (this.foreign) game.livingForeignClones -= 1
        else game.livingClones -= 1
        cloneMap.delete(this.id)
    }


    // SPRITES

    const Sprites = {}
    Sprites.worldBoundary = function() {
        this.id = "worldBoundary"
        this.draw()
        spriteMap.set(this.id,this)
    }
    Sprites.worldBoundary.prototype.draw = function() {
        Artist.outlineCircle(0,0,game.worldRadius+1,0.4,"#AA7777")
    }
    Sprites.worldBoundary.prototype.step = function() {
        return null
    }
    Sprites.cloneHighlight = function(clone) {
        this.id = "cloneHighlight"
        this.clone = clone
        this.draw()
        spriteMap.set(this.id,this)
    }
    Sprites.cloneHighlight.prototype.draw = function() {
        Artist.outlineCircle(this.clone.worldPosition.x,this.clone.worldPosition.y,this.clone.radius+0.15,0.17,"#0F0")
    }
    Sprites.cloneHighlight.prototype.step = function() {
        if (!game.pause) {
            Artist.clipCircle(this.clone.worldPosition.x,this.clone.worldPosition.y,this.clone.maxRadius*2)
            cloneMap.get(`${this.clone.xHash}_${this.clone.yHash}`).draw()
            for (var p = 0; p < 6; p++) {
                var hash = this.clone._getHashFromPosition(p)
                var neighbor = cloneMap.get(`${hash.x}_${hash.y}`)
                if (neighbor) neighbor.draw()
            }
            spriteMap.delete("cloneHighlight")
        }
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
            description: "Used to spit out... I mean gently bring a new clone into existence.",
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
            description: "By jetisoning organic tissue suspended in a high-energy control ray, an entire group of unfortunate clones can be grotesquely reanimated... I mean beautifully, er, coalesced back to their, uh, intended forms.",
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
            name: "Smiting Bolt",
            description: "Painlessly (yes, that should sell these matter-dissolving hell engi... am I saying this out loud?) eliminates a single clone."
        },
    }

    // AUGMENTATIONS
    var Augmentations = {
        longevityX2: {
            use: null,
            name: "Longevity (x2)",
            description: "Prolong... I mean, uh, extend the happy, very happy, life of a clone!"
        }
    }
    // ARTIFACTS


    // GAMEPLAY LOOP
    const gameplay = () => {
        if (!game.pause) {
            Framerate.register()
            game.steps += 1
            Input.apply()
            if (Math.random() > 0.99) {
                new Clone(
                    Math.floor(Math.random()*2*game.worldRadius) - game.worldRadius,
                    Math.floor(Math.random()*2*game.worldRadius) - game.worldRadius,
                    {foreign:true}
                )
            }
            cloneMap.forEach( clone => clone.step() )
            spriteMap.forEach( sprite => sprite.step() )
            if (game.steps % 60 === 0) {
                Menu.updateStats()
                Framerate.reset()
            }
        }
        window.requestAnimationFrame(gameplay)
    }

    // SAVE AND LOAD
    const save = () => {
        var saveData = JSON.stringify({
            cloneMap: Array.from(cloneMap).map( clone => clone[1] ),
            spriteMap: Array.from(spriteMap).map( sprite => sprite[1] ),
            view:view,
            game:game
        })
        var anchor = createHtmlElement("a", { href: "data:text/html,"+btoa(saveData), download: "CLONE_saveGame.txt" })
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
        delete anchor
    }
    const load = saveData => {
/*
var openFile = function(event) {
        var input = event.target;

        var reader = new FileReader();
        reader.onload = function(){
          var text = reader.result;
          var node = document.getElementById('output');
          node.innerText = text;
          console.log(reader.result.substring(0, 200));
        };
        reader.readAsText(input.files[0]);
      };
    </script>
    </head>
    <body>
    <input type='file' accept='text/plain' onchange='openFile(event)'><br>
*/




        saveData = saveData || {}
        cloneMap = new Map()
        spriteMap = new Map()
        view = {
            scale:7,
            xPos:0,
            yPos:0,
            bounds: {},
            screenSize: {}
        }
        game = {
            steps:0,
            resources:0,
            livingClones:0,
            livingMutantClones:0,
            livingForeignClones:0,
            lifetimeClones:0,
            lifetimeMutantClones:0,
            lifetimeForeignClones:0,
            items:{
                genesisPod: 15,
                genesisRay: 1,
                smitingBolt: 1,
            },
            artifacts:[],
            pause:false,
            worldRadius:10
        }
        new Sprites.worldBoundary()
        Artist.resize()
        Menu.refresh()
        Framerate.reset()
        Input.enable()
        gameplay()
    }

    return function() {
        // initialization
        CloneUI.init()
        Artist.init()
        Store.init()
        Menu.init()
        // start gameplay
        load()
    }

})()


window.onload = CLONE_Game



/*

        const init2 = function(){
            // keyboard input
            window.addEventListener("keyup", event => state[bindings[event.key]] = false)
            window.addEventListener("keydown", event => {
                let action = bindings[event.key]
                state[action] = true
                if (!game.pause) toggle(action)
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

*/

