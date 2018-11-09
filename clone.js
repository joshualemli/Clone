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
        CLONE_VERSION = "0.2.1",
        CLONE_RELEASE = "dev",
        CLONE_EDITION = "undreamer";
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
        
        var enabled = false, clickMode = 0, selectedTool = null

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
                    Menu.update()
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
            if (Math.sqrt(x*x+y*y) > game.worldRadius + 0.5) return console.log("click out of world bounds")
            let yHash = Math.round(y / Clone.prototype.yMultiplier)
            let yOdd = yHash % 2 !== 0 ? Clone.prototype.xStagger : 0
            let xHash = Math.round((x - yOdd) / Clone.prototype.xMultiplier)
            switch (clickMode) {
                case 0: // Inspect
                    let id = `${xHash}_${yHash}`
                    if (cloneMap.has(id)) CloneUI.update(id)
                    break
                case 1: // Use Tool
                    if (selectedTool && Tools[selectedTool].use(xHash,yHash)) {
                        game.tools[selectedTool] -= 1
                        if (game.tools[selectedTool] === 0) {
                            clickMode = 0
                        }
                        Menu.updateTools()
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
            setClickMode : n => clickMode = n,
            setSelectedTool : t => {
                if (selectedTool === t) {
                    selectedTool = null
                    return false
                }
                selectedTool = t
                return true
            }
        }
    })()


    var Artist = (function(){
        var canvas, context, windowResizeTimeout
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
            canvas.parentElement.addEventListener("resize",event=>console.log(event))
            window.addEventListener("resize", () => {
                if (windowResizeTimeout) clearTimeout(windowResizeTimeout)
                windowResizeTimeout = setTimeout(resize,100)
            })
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
        var dom, resumeGameplayOnClose, selectedQuantity, selectedItem, selectedItemGameCategory, selectedItemGameId
        const _setResourcesHtml = () => dom.resources.innerHTML = "$" + game.resources.toFixed(2)
        const open = () => {
            if (!game.pause) resumeGameplayOnClose = game.pause = true
            else resumeGameplayOnClose = false
            _setDetails()
            _setResourcesHtml()
            dom.container.classList.remove("occlude")
            Input.disable()
        }
        const close = () => {
            Input.enable()
            dom.container.classList.add("occlude")
            if (resumeGameplayOnClose) game.pause = false
        }
        const purchase = () => {
            let subtotal = selectedQuantity * selectedItem.cost
            if (game.resources >= subtotal) {
                dom.itemDetails.purchase.style.transition = ""
                dom.itemDetails.purchase.style.backgroundColor = "#F75"
                setTimeout(()=>{
                    dom.itemDetails.purchase.style.transition = "background-color 0.5s"
                    dom.itemDetails.purchase.style.backgroundColor = "#CCC"
                },100)
                game.resources -= subtotal
                _setResourcesHtml()
                if (selectedItemGameCategory === "artifacts") {

                }
                else if (game[selectedItemGameCategory][selectedItemGameId]) game[selectedItemGameCategory][selectedItemGameId] += selectedQuantity
                else game[selectedItemGameCategory][selectedItemGameId] = selectedQuantity
            }
            else console.log("not enough dough")
        }
        const _setDetails = (_Section,gameSection,key) => {
            if (!_Section) {
                selectedItem = {}
                selectedItemGameCategory = null
                selectedItemGameId = null
            }
            else {
                selectedItem = _Section[key]
                selectedItemGameCategory = gameSection
                selectedItemGameId = key
            }
            selectedQuantity = 1
            dom.itemDetails.name.innerHTML = selectedItem.name || ""
            dom.itemDetails.description.innerHTML = selectedItem.description || ""
            let costString = selectedItem.cost ? ("$" + selectedItem.cost.toFixed(2)) : ""
            dom.itemDetails.cost.innerHTML = costString
            dom.itemDetails.costMultiplier.innerHTML = costString ? (" x " + costString + " = ") : ""
            dom.itemDetails.quantity.innerHTML = selectedItem.cost ? selectedQuantity : ""
            dom.itemDetails.subtotal.innerHTML = selectedItem.cost ? ("$"+((selectedItem.cost || 0) * selectedQuantity).toFixed(2)) : ""
        }
        const init = () => {
            // html pointers
            dom = {
                container: document.getElementById("store"),
                resources: document.getElementById("store-yourResources-value"),
                itemDetails: {
                    icon: document.getElementById("store-itemDetails-icon"),
                    name: document.getElementById("store-itemDetails-name"),
                    description: document.getElementById("store-itemDetails-description"),
                    minusTen: document.getElementById("store-itemDetails-minusTen"),
                    minusOne: document.getElementById("store-itemDetails-minusOne"),
                    plusTen: document.getElementById("store-itemDetails-plusTen"),
                    plusOne: document.getElementById("store-itemDetails-plusOne"),
                    cost: document.getElementById("store-itemDetails-cost"),
                    quantity: document.getElementById("store-itemDetails-quantity"),
                    costMultiplier: document.getElementById("store-itemDetails-costMultiplier"),
                    subtotal: document.getElementById("store-itemDetails-subtotal"),
                    purchase: document.getElementById("store-itemDetails-purchase")
                },
                tools: {
                    container: document.getElementById("store-section-tools"),
                },
                augmentations: {
                    container: document.getElementById("store-section-augmentations"),
                },
                artifacts: {
                    container: document.getElementById("store-section-artifacts"),
                },
                exit: document.getElementById("store-exit"),
            }
            let _itemHtml = item => `<div class="store-section-merchandise-item">${item.name}</div>`
            for (let key in Tools) {
                dom.tools[key] = createHtmlElement("div",{
                    innerHTML: _itemHtml(Tools[key])
                })
                dom.tools.container.appendChild(dom.tools[key])
                dom.tools[key].onclick = event => _setDetails(Tools,"tools",key)
            }
            for (let key in Augmentations) {
                if (key[0] === "_") continue // ignore "private" functions
                dom.augmentations[key] = createHtmlElement("div",{
                    innerHTML: _itemHtml(Augmentations[key])
                })
                dom.augmentations.container.appendChild(dom.augmentations[key])
                dom.augmentations[key].onclick = event => _setDetails(Augmentations,"unusedAugmentations",key)
            }
            // for (key in Artifacts) {}
            // behavior
            let adjustQuantity = (key,quantity) => {
                if (!selectedItem.cost) return null
                if (!selectedQuantity) selectedQuantity = 0
                selectedQuantity += quantity
                if (selectedQuantity < 0) selectedQuantity = 0
                dom.itemDetails.quantity.innerHTML = selectedQuantity
                dom.itemDetails.subtotal.innerHTML = "$" + (selectedItem.cost * selectedQuantity).toFixed(2)
            }
            dom.itemDetails.plusTen.onclick = event => adjustQuantity(selectedItem,10)
            dom.itemDetails.plusOne.onclick = event => adjustQuantity(selectedItem,1)
            dom.itemDetails.minusOne.onclick = event => adjustQuantity(selectedItem,-1)
            dom.itemDetails.minusTen.onclick = event => adjustQuantity(selectedItem,-10)
            dom.itemDetails.purchase.onclick = purchase
            dom.exit.onclick = close
        }
        return {
            init : init,
            open : open,
            close : close,
            confirm : confirm
        }
    })()


    const Menu = (function(){
        var dom, readoutOpen, toolsOpen
        const updateReadout = () => {
            dom.readout.countBar.clones.innerHTML = game.extantClones
            dom.readout.countBar.clones.style.flex = (game.extantClones>0 ? Math.floor(100*game.extantClones/cloneMap.size).toString() : "1") + " 0 auto"
            dom.readout.countBar.mutant.innerHTML = game.extantMutant
            dom.readout.countBar.mutant.style.flex = (game.extantMutant>0 ? Math.floor(100*game.extantMutant/cloneMap.size).toString() : "1") + " 0 auto"
            dom.readout.countBar.foreign.innerHTML = game.extantForeign
            dom.readout.countBar.foreign.style.flex = (game.extantForeign>0 ? Math.floor(100*game.extantForeign/cloneMap.size).toString() : "1") + " 0 auto"
            dom.readout.perished.clones.innerHTML = game.perishedClones
            dom.readout.perished.mutant.innerHTML = game.perishedMutant
            dom.readout.perished.foreign.innerHTML = game.perishedForeign
            // var production = 0
            // cloneMap.forEach( clone => production += clone.production )
            // production *= Framerate.fps()
        }
        const updateTools = () => {
            for (var key in game.tools) dom.tools[key].innerHTML = game.tools[key]
        }
        const update = () => {
            if (toolsOpen) updateTools()
            if (readoutOpen) updateReadout()
        }
        return {
            init : () => {
                // flags
                readoutOpen = toolsOpen = false
                // element pointers
                dom = {
                    callsign: document.getElementById("menu-callsign"),
                    saveButton: document.getElementById(""),
                    loadButton: document.getElementById(""),
                    openShopButton: document.getElementById("menu-openButton-shop"),
                    openToolsButton: document.getElementById("menu-openButton-tools"),
                    openReadoutButton: document.getElementById("menu-openButton-readout"),
                    readout: {
                        container: document.getElementById("menu-readout"),
                        countBar: {
                            clones: document.getElementById("menu-readout-countBar-clones"),
                            mutant: document.getElementById("menu-readout-countBar-mutant"),
                            foreign: document.getElementById("menu-readout-countBar-foreign"),
                        },
                        perished: {
                            clones: document.getElementById("menu-readout-perishedClones"),
                            mutant: document.getElementById("menu-readout-perishedMutant"),
                            foreign: document.getElementById("menu-readout-perishedForeign"),
                        }
                    },
                    tools: {
                        container: document.getElementById("menu-tools")
                    }
                }
                for (let key in Tools) {
                    let toolElement = createHtmlElement("div",{
                        className: "menu-tools-tool flexRow",
                        innerHTML: `<div class="menu-tools-tool-label">${Tools[key].name}</div><div class="menu-tools-tool-quantity">0</div>`
                    })
                    dom.tools.container.appendChild(toolElement)
                    toolElement.onclick = event => {
                        dom.tools.container.querySelectorAll(".menu-tools-selectedTool").forEach( e => e.classList.remove("menu-tools-selectedTool") )
                        document.getElementsByClassName("menu-tools-selectedTool")
                        if (!Input.setSelectedTool(key) || game.tools[key] === 0) {
                            Input.setClickMode(0)
                        }
                        else {
                            Input.setClickMode(game.tools[key] ? 1 : 0)
                            toolElement.children[0].classList.add("menu-tools-selectedTool")
                        }
                    }
                    dom.tools[key] = toolElement.children[1]
                }
                // set behavior
                dom.openShopButton.onclick = Store.open
                dom.openReadoutButton.onclick = () => {
                    dom.openReadoutButton.classList.toggle("menu-openButton-opened")
                    readoutOpen = !dom.readout.container.classList.toggle("occlude")
                    Artist.resize()
                }
                dom.openToolsButton.onclick = () => {
                    dom.openToolsButton.classList.toggle("menu-openButton-opened")
                    toolsOpen = !dom.tools.container.classList.toggle("occlude")
                    Menu.updateTools()
                    Artist.resize()
                }
            },
            update : update,
            updateTools : updateTools
        }
    })()


    const CloneUI = (function() {
        var dom, id, uid
        const show = () => {
            dom.container.classList.remove("occlude")
            Artist.resize()
        }
        const hide = () => {
            dom.container.classList.add("occlude")
            Artist.resize()
        }
        const applyAugmentation = () => {}
        const _augElem = (key,quantity) => {
            let augElem = createHtmlElement("div",{
                className: "cloneUI-augmentations-item flexRow",
                innerHTML: `<div class="cloneUI-augmentations-item-name">${Augmentations[key].name}</div><div class="cloneUI-augmentations-item-count">${quantity}</div>`
            })
            augElem.dataset.key = key
            return augElem
        }
        const updateAugmentations = () => {
            while (dom.augmentations.available.firstElementChild) dom.augmentations.available.removeChild(dom.augmentations.available.firstElementChild)
            for (let key in game.unusedAugmentations) {
                let elem = _augElem(key,game.unusedAugmentations[key])
                dom.augmentations.available.appendChild(elem)
                elem.onclick = event => {
                    if (!game.unusedAugmentations[key]) throw new Error("should not happen")
                    if (parseInt(elem.children[1].innerHTML) === 0) return null
                    elem.children[1].innerHTML = parseInt(elem.children[1].innerHTML) - 1
                    let extantPending = Array.from(dom.augmentations.pending.children).find(e=>e.dataset.key==key)
                    let pending = extantPending || _augElem(key,1)
                    if (!extantPending) {
                        dom.augmentations.pending.appendChild(pending)
                        pending.onclick = () => {
                            elem.children[1].innerHTML = parseInt(elem.children[1].innerHTML) + 1
                            pending.children[1].innerHTML = parseInt(pending.children[1].innerHTML) - 1
                            if (parseInt(pending.children[1].innerHTML) === 0) dom.augmentations.pending.removeChild(pending)
                        }
                    }
                    else pending.children[1].innerHTML = parseInt(pending.children[1].innerHTML) + 1
                }
            }
        }
        return {
            init : () => {
                dom = {
                    container: document.getElementById("cloneUI"),
                    augmentations: {
                        available: document.getElementById("cloneUI-augmentations-available"),
                        pending: document.getElementById("cloneUI-augmentations-pending"),
                        applyButton: document.getElementById("cloneUI-augmentations-applyButton"),
                        applied: document.getElementById("cloneUI-augmentations-applied")
                    },
                    info: {
                        container: document.getElementById("cloneUI-info"),
                        name: document.getElementById("cloneUI-info-name"),
                        age: document.getElementById("cloneUI-info-age"),
                        maxAge: document.getElementById("cloneUI-info-maxAge"),
                        generation: document.getElementById("cloneUI-info-generation"),
                        production :document.getElementById("cloneUI-info-production"),
                        lifetimeProduction: document.getElementById("cloneUI-info-lifetimeProduction"),
                        cloningRate: document.getElementById("cloneUI-info-cloningRate"),
                        descendants: document.getElementById("cloneUI-info-descendants")
                    }
                }
            },
            update : (setId) => {
                var clone = null
                if (setId) {
                    clone = cloneMap.get(setId)
                    id = setId
                    uid = clone.uid
                    new Array("clones","mutant","foreign").forEach( classPart => dom.container.classList.remove(`border-${classPart}`) )
                    // update once:
                    if (clone.mutant) dom.container.classList.add("border-mutant")
                    else if (clone.foreign) dom.container.classList.add("border-foreign")
                    else dom.container.classList.add("border-clones")
                    dom.info.name.innerHTML = clone.name
                    dom.info.generation.innerHTML = clone.generation
                    updateAugmentations()
                    show()
                }
                else if (!id) return null
                else {
                    clone = cloneMap.get(id)
                    if (!clone || clone.uid !== uid) {
                        hide()
                        id = uid = null
                        return null
                    }
                }
                // always update:
                dom.info.age.innerHTML = clone.age
                dom.info.maxAge.innerHTML = clone.maxAge
                dom.info.production.innerHTML = clone.production.toFixed(2)
                dom.info.lifetimeProduction.innerHTML = clone.lifetimeProduction.toFixed(2)
                dom.info.cloningRate.innerHTML = ((1 - clone.cloningFailureChance)*100).toFixed(2)+ "%"
                dom.info.descendants.innerHTML = clone.descendants
            }
        }
    })()


    // CLONE CLASS
    
    function Clone(xHash,yHash,override) {
        override = override || {}
        this.xHash = xHash
        this.yHash = yHash
        this.id = `${this.xHash.toString()}_${this.yHash.toString()}`
        this.uid = `${this.id}_${game.steps.toString()}`
        this.yOdd = Math.abs(this.yHash%2) === 1 ? 1 : 0
        this.worldPosition = this.getWorldPosition()
        // out of bounds or exists
        if (
            Math.sqrt(this.worldPosition.x*this.worldPosition.x+this.worldPosition.y*this.worldPosition.y) > game.worldRadius
            ||
            cloneMap.has(this.id)
        ) {
            delete this.id
            return null
        }
        this.name = [
            this.nameLexicon.FIRST[Math.floor(Math.random()*this.nameLexicon.FIRST.length)],
            this.nameLexicon.MIDDLE[Math.floor(Math.random()*this.nameLexicon.MIDDLE.length)],
            this.nameLexicon.LAST[Math.floor(Math.random()*this.nameLexicon.LAST.length)]
        ].join(" ")
        this.age = 0
        this.maxAge = override.maxAge || 50
        this.generation = override.generation || 1
        // type
        this.mutant = override.mutant ? true : (Math.random() > 1 - this.generation / 1e8 ? true : false)
        this.foreign = override.foreign || false
        // augmentations
        this.augmentations = {}
        // cloning
        this.fertileAge = override.fertileAge || 20
        this.cloningFailureChance = override.cloningFailureChance || 0.965
        if (this.mutant) this.cloningFailureChance *= 0.98
        // production
        this.production = (this.mutant||this.foreign) ? 0 : (override.production || 0.01)
        this.lifetimeProduction = 0
        this.descendants = 0
        this.radius = this.maxRadius*0.7
        this._drawn = false
        if (this.mutant) {
            this._color = `rgb(${Math.floor(Math.random()*70+85)},${Math.floor(Math.random()*20)},${Math.floor(Math.random()*70+85)})`
            game.extantMutant += 1
        }
        else if (this.foreign) {
            this._color = `rgb(${Math.floor(Math.random()*90+100)},${Math.floor(Math.random()*20)},${Math.floor(Math.random()*20)})`
            game.extantForeign += 1
        }
        else {
            this._color = `rgb(${Math.floor(Math.random()*20)},${Math.floor(Math.random()*100 + 110)},${Math.floor(Math.random()*80)})`
            game.extantClones += 1
            game.perishedClones += 1
        }
        cloneMap.set(this.id,this)
        this.draw()
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
        this.descendants += 1
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
        if (this.mutant) {
            game.extantMutant -= 1
            game.perishedMutant += 1
        }
        else if (this.foreign) {
            game.extantForeign -= 1
            game.perishedForeign += 1
        }
        else {
            game.extantClones -= 1
            game.perishedClones += 1
        }
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
        Artist.clipCircle(this.clone.worldPosition.x,this.clone.worldPosition.y,this.clone.maxRadius*2)
        for (var p = 0; p < 6; p++) {
            var hash = this.clone._getHashFromPosition(p)
            var neighbor = cloneMap.get(`${hash.x}_${hash.y}`)
            if (neighbor) neighbor.draw()
        }
        spriteMap.delete("cloneHighlight")
        let clone = cloneMap.get(`${this.clone.xHash}_${this.clone.yHash}`)
        if (clone) clone.draw()
    }


    // ITEMS
    const Tools = {
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
            description: "Used to spit out... we mean gently bring a new clone into existence.",
            cost: 0.9,
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
            cost: 7.2,
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
            description: "Painlessly (yes, that sounds good, that should sell these matter-dissolving hell engi... is this thing on?) eliminates a single clone.",
            cost: 3.35
        },
        deionizer: {
            use: (xHash,yHash) => {
                py = yHash * Clone.prototype.yMultiplier
                px = xHash * Clone.prototype.xMultiplier + (yHash%2!==0?Clone.prototype.xStagger:0)
                var x,y,dx,dy,yOdd,target
                for (var i = 0; i < 50; i++) {
                    dx = Math.random()*8 - 4
                    dy = Math.random()*8 - 4
                    if (Math.sqrt(dx*dx+dy*dy) > 4) continue
                    x = px+dx
                    y = py+dy
                    yHash = Math.round(y / Clone.prototype.yMultiplier)
                    yOdd = yHash % 2 !== 0 ? Clone.prototype.xStagger : 0
                    xHash = Math.round((x - yOdd) / Clone.prototype.xMultiplier)
                    target = cloneMap.get(`${xHash.toString()}_${yHash.toString()}`)
                    if (target) target.perish()
                }
                return true
            },
            name: "Deionizer",
            description: "Renders all clones' essential biochemical processes, um... inert. Works over a sizeable radius.",
            cost: 17.99
        }
    }

    // AUGMENTATIONS
    var Augmentations = {
        _increment: (clone,key) => {
            if (!clone.augmentations[key]) clone.augmentations[key] = 1
            else clone.augmentations[key] += 1
        },
        longevityX3: {
            use: clone => {
                Augmentations._increment(clone,"longevityX3")
                clone.maxAge *= 3
            },
            name: "Longevity (x3)",
            description: "Prolong -- wait, sorry, our mistake -- <i>extend</i> the happy, very happy, life of a clone!",
            cost: 0.95
        },
        longevityX25: {
            use: clone => {
                Augmentations._increment(clone,"longevityX25")
                clone.maxAge *= 25
            },
            name: "Longevity (x25)",
            description: "This is really a totally natural process, trust us.  Clones love it.  Don't ask them about it though, they would probably just want the next level up in our product line and seriously, who can afford that?  Oh but if you could, oh man.  That's the stuff.",
            cost: 22.45
        },
        longevityX500: {
            use: clone => {
                Augmentations._increment(clone,"longevityX100")
                clone.maxAge *= 500
            },
            name: "Longevity (x100)",
            description: `While this modification is, well, "difficult" on the clone, the potential rewards are fantastic.  For you.`,
            cost: 211
        },
        immortality: {
            use: clone => {
                Augmentations._increment(clone,"immortality")
                clone.maxAge = Infinity
                clone._color = "rgb(255,215,0)";
            },
            name: "Immortality",
            description: "Literally, no shit, your clone will be immortal.  Will do nothing for their temperment, however.",
            cost: 1
        },
    }
    // ARTIFACTS (in value/order?)
    // 
    // opalescent ward - 99/100 foreign spawn rate
    // fluorescent ward - 49/50 foreign spawn rate
    // viridescent ward - 9/10 foreign spawn rate
    // tears of urizen - 99/100 mutation rate (clones)
    // maths of urizen - 49/50 mutation rate (clones)
    // light of urizen - 9/10 mutation rate (clones)
    // labor of urizen - 1/2 mutation rate
    // cobalt fusion engine - world radius +2
    // hyperstate induction engine - world radius +3
    // bioschismatic extraction engine - world radius +5
    // dark energy transmutation engine - world radius +10
    // hawking-cipolla expansion limit engine - world radius +20
    // zelda stone - random clone spawns
    // metroid stone - smiting bolt infinite ammo ???
    // halflife stone - double production and reproduction rate, half lifespan !!! ultimate


    // GAMEPLAY LOOP
    const gameplay = () => {
        Input.apply()
        if (!game.pause) {
            Framerate.register()
            game.steps += 1
            if (Math.random() > 0.99) {
                new Clone(
                    Math.floor(Math.random()*2*game.worldRadius/Clone.prototype.xMultiplier) - game.worldRadius,
                    Math.floor(Math.random()*2*game.worldRadius/Clone.prototype.yMultiplier) - game.worldRadius,
                )
                new Clone(
                    Math.floor(Math.random()*2*game.worldRadius/Clone.prototype.xMultiplier) - game.worldRadius,
                    Math.floor(Math.random()*2*game.worldRadius/Clone.prototype.yMultiplier) - game.worldRadius,
                    {foreign:true}
                )
            }
            cloneMap.forEach( clone => clone.step() )
            spriteMap.forEach( sprite => sprite.step() )
            if (game.steps % 30 === 0) {
                Menu.update()
                CloneUI.update()
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
        if (saveData.cloneMap) saveData.cloneMap.forEach( cloneInfo => {
            new Clone(cloneInfo.xHash,cloneInfo.yHash,cloneInfo)
        })
        spriteMap = new Map()
        view = saveData.view || {
            scale:7,
            xPos:0,
            yPos:0,
            bounds: {},
            screenSize: {}
        }
        game = saveData.game || {
            steps:0,
            resources:0,
            extantClones:0,
            extantMutant:0,
            extantForeign:0,
            perishedClones:0,
            perishedMutant:0,
            perishedForeign:0,
            tools:{
                genesisPod: 100,
                genesisRay: 100,
                smitingBolt: 100,
                deionizer: 100,
            },
            unusedAugmentations:{
                immortality:10
            },
            artifacts:[],
            pause:false,
            worldRadius:20
        }
        new Sprites.worldBoundary()
        Artist.resize()
        Menu.update()
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



