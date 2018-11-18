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
        CLONE_VERSION = "0.5.0",
        CLONE_RELEASE = "beta",
        CLONE_EDITION = "nuclear dog";
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

    const numberToCurrency = n => n.toLocaleString("en-US",{style:"currency",currency:"USD"})


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
            "0" : "recenterView",
            "s" : "openShop",
            "t" : "toggleTools",
            "r" : "toggleReadout",
        }
        var state = {}
        const toggle = action => {
            switch(action) {
                case "pause":
                    game.pause = !game.pause
                    Menu.update()
                    CloneUI.update()
                    break
                case "recenterView":
                    view.xPos = view.yPos = 0
                    view.scale = 10
                    Artist.redraw()
                    break
                case "openShop":
                    Store.toggle()
                    break
                case "toggleTools":
                    Menu.toggle.tools()
                    break
                case "toggleReadout":
                    Menu.toggle.readout()
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
            // Artist.fillCircle(x,y,0.1,"rgb(0,0,255)")
            if (Math.sqrt(x*x+y*y) > game.worldRadius + 0.5) {
                CloneUI.clear()
                return console.log("click out of world bounds")
            }
            let yHash = Math.round(y / Clone.prototype.yMultiplier)
            let yOdd = yHash % 2 !== 0 ? Clone.prototype.xStagger : 0
            let xHash = Math.round((x - yOdd) / Clone.prototype.xMultiplier)
            switch (clickMode) {
                case 0: // Inspect
                    let id = `${xHash}_${yHash}`
                    if (cloneMap.has(id)) CloneUI.update(id)
                    else CloneUI.clear()
                    break
                case 1: // Use Tool
                    if (selectedTool && Tools[selectedTool].use(xHash,yHash)) {
                        game.tools[selectedTool] -= 1
                        if (game.tools[selectedTool] === 0) {
                            clickMode = 0
                            selectedTool = null
                            Menu.updateTools(true)
                        }
                        else Menu.updateTools()
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
        var canvas, context, lastResizeTime, resizeTimeout
        const _timeSinceLastResize = () => new Date().getTime() - lastResizeTime
        const RESIZE_TIME_INTERVAL = 250
        const redraw = () => {
            context.setTransform(1,0,0,1,0,0)
            context.clearRect(0,0,context.canvas.width,context.canvas.height)
            context.setTransform(view.scale,0,0,-view.scale, context.canvas.width/2 - view.xPos*view.scale, context.canvas.height/2 + view.yPos*view.scale)
            Artist.setBounds()
            cloneMap.forEach( clone => clone.draw() )
            spriteMap.forEach( sprite => sprite.draw() )
        }
        const resize = () => {
            canvas.width = context.canvas.width = view.screenSize.x = canvas.parentElement.offsetWidth
            canvas.height =  context.canvas.height = view.screenSize.y = canvas.parentElement.offsetHeight
            redraw()
            lastResizeTime = new Date().getTime()
        }
        const _meteredResize = () => {
            if (_timeSinceLastResize() > RESIZE_TIME_INTERVAL) resize()
            else {
                if (resizeTimeout) clearTimeout(resizeTimeout)
                resizeTimeout = setTimeout(resize, RESIZE_TIME_INTERVAL)
            }
        }
        const init = () => {
            canvas = document.querySelector("#mainCanvas")
            context = canvas.getContext("2d")
            canvas.parentElement.addEventListener("resize",event=>console.log(event))
            window.addEventListener("resize", _meteredResize)
            setInterval(()=>{
                if (canvas.height != canvas.parentElement.offsetHeight || canvas.width != canvas.parentElement.offsetWidth) _meteredResize()
            },2000)
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
        const _setResourcesHtml = () => dom.resources.innerHTML = numberToCurrency(game.resources)
        const _setOwnedQuantity = () => dom.itemDetails.owned.innerHTML = (selectedItemGameCategory&&selectedItemGameId&&game[selectedItemGameCategory][selectedItemGameId]) ? game[selectedItemGameCategory][selectedItemGameId] : "0"
        const _closeStoreListenerCallback = function(event) {
            window.removeEventListener("keydown",_closeStoreListenerCallback)
            close()
        }
        const open = () => {
            if (!game.pause) resumeGameplayOnClose = game.pause = true
            else resumeGameplayOnClose = false
            _setResourcesHtml()
            _setOwnedQuantity()
            dom.container.classList.remove("occlude")
            Input.disable()
            window.addEventListener("keydown",_closeStoreListenerCallback)
        }
        const close = () => {
            dom.container.classList.add("occlude")
            if (resumeGameplayOnClose) game.pause = false
            Menu.update()
            CloneUI.updateAugmentations()
            Input.enable()
        }
        const purchase = () => {
            let subtotal = selectedQuantity * selectedItem.cost
            if (game.resources >= subtotal) {
                if (selectedItemGameCategory === "artifices") {
                    if (game.artifices[selectedItemGameId]) return null
                    else game.artifices[selectedItemGameId] = 1
                    Artifices[selectedItemGameId].use()
                    Menu.updateArtifices()
                }
                else if (game[selectedItemGameCategory][selectedItemGameId]) game[selectedItemGameCategory][selectedItemGameId] += selectedQuantity
                else game[selectedItemGameCategory][selectedItemGameId] = selectedQuantity
                dom.itemDetails.purchase.style.transition = ""
                dom.itemDetails.purchase.style.backgroundColor = "#F75"
                setTimeout(()=>{
                    dom.itemDetails.purchase.style.transition = "background-color 0.5s"
                    dom.itemDetails.purchase.style.backgroundColor = "#CCC"
                },100)
                game.resources -= subtotal
                _setResourcesHtml()
                _setOwnedQuantity()
            }
            else console.log("not enough dough")
        }
        const _adjustQuantity = (quantity) => {
            if (!selectedItem.cost) return null
            if (!selectedQuantity) selectedQuantity = 0
            selectedQuantity += quantity
            if (selectedQuantity < 0) selectedQuantity = 0
            if (selectedItemGameCategory === "artifices" && selectedQuantity > 1) selectedQuantity = 1
            dom.itemDetails.quantity.innerHTML = "x"+selectedQuantity.toString()
            dom.itemDetails.subtotal.innerHTML = numberToCurrency(selectedItem.cost * selectedQuantity)
        }
        const _setDetails = (_Section,gameSection,key) => {
            dom.itemDetails.topBar.classList.remove("occlude")
            selectedItem = _Section[key]
            selectedItemGameCategory = gameSection
            selectedItemGameId = key
            selectedQuantity = 1
            dom.itemDetails.name.innerHTML = selectedItem.name || ""
            dom.itemDetails.description.innerHTML = selectedItem.description || ""
            let costString = selectedItem.cost ? numberToCurrency(selectedItem.cost) : ""
            dom.itemDetails.cost.innerHTML = costString
            _adjustQuantity(0)
            _setOwnedQuantity()
        }
        const init = () => {
            // html pointers
            dom = {
                container: document.getElementById("store"),
                resources: document.getElementById("store-yourResources-value"),
                itemDetails: {
                    topBar: document.getElementById("store-itemDetails-topBar"),
                    icon: document.getElementById("store-itemDetails-icon"),
                    name: document.getElementById("store-itemDetails-name"),
                    owned: document.getElementById("store-itemDetails-owned"),
                    description: document.getElementById("store-itemDetails-description"),
                    minusTen: document.getElementById("store-itemDetails-minusTen"),
                    minusOne: document.getElementById("store-itemDetails-minusOne"),
                    plusTen: document.getElementById("store-itemDetails-plusTen"),
                    plusOne: document.getElementById("store-itemDetails-plusOne"),
                    cost: document.getElementById("store-itemDetails-cost"),
                    quantity: document.getElementById("store-itemDetails-quantity"),
                    subtotal: document.getElementById("store-itemDetails-subtotal"),
                    purchase: document.getElementById("store-itemDetails-purchase")
                },
                tools: {
                    container: document.getElementById("store-section-tools"),
                },
                augmentations: {
                    container: document.getElementById("store-section-augmentations"),
                },
                artifices: {
                    container: document.getElementById("store-section-artifices"),
                },
                exit: document.getElementById("store-exit"),
            }
            let _itemHtml = item => createHtmlElement("div",{
                className: "store-merchandise-item",
                innerHTML: item.name
            })
            let _handleItemClick = event => {
                dom.container.querySelectorAll(".store-merchandise-selectedItem").forEach( e => e.classList.remove("store-merchandise-selectedItem") )
                event.target.classList.add("store-merchandise-selectedItem")
            }
            new Array([Tools,"tools"],[Augmentations,"augmentations"],[Artifices,"artifices"]).forEach( sectionInfo => {
                for (let key in sectionInfo[0]) {
                    dom[sectionInfo[1]][key] = _itemHtml(sectionInfo[0][key])
                    dom[sectionInfo[1]].container.appendChild(dom[sectionInfo[1]][key])
                    dom[sectionInfo[1]][key].onclick = event => {
                        _handleItemClick(event)
                        _setDetails(sectionInfo[0],sectionInfo[1],key)
                    }
                }
            })

            // behavior

            dom.itemDetails.plusTen.onclick = event => _adjustQuantity(10)
            dom.itemDetails.plusOne.onclick = event => _adjustQuantity(1)
            dom.itemDetails.minusOne.onclick = event => _adjustQuantity(-1)
            dom.itemDetails.minusTen.onclick = event => _adjustQuantity(-10)
            dom.itemDetails.purchase.onclick = purchase
            dom.exit.onclick = close
        }
        return {
            init : init,
            open : open,
            close : close,
            confirm : confirm,
            toggle : () => Store[dom.container.classList.contains("occlude") ? "open" : "close"]()
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
            dom.readout.resources.innerHTML = numberToCurrency(game.resources)
            var production = 0
            cloneMap.forEach( clone => production += clone.production )
            if (game.artifices.netsOfUrizen) production += game.extantClones * 0.01
            if (game.artifices.bookOfUrizen) production += game.extantClones * 0.02
            if (game.artifices.LightOfUrizen) production += game.extantClones * 0.05
            if (game.artifices.LaborOfUrizen) production += cloneMap.size * 0.01
            production *= Framerate.fps()
            dom.readout.production.innerHTML = `${numberToCurrency(production)}/s`
        }
        const updateArtifices = (clearExisting) => {
            if (clearExisting) {
                while (dom.readout.artifices.firstElementChild) dom.readout.artifices.removeChild(dom.readout.artifices.firstElementChild)
                dom.readout.artificeItems = {}
            }
            for (let key in game.artifices) if (!dom.readout.artificeItems[key]) {
                dom.readout.artificeItems[key] = createHtmlElement("div",{
                    innerHTML: Artifices[key].name
                })
                dom.readout.artifices.appendChild(dom.readout.artificeItems[key])
            }
        }
        const updateTools = (useInspect) => {
            for (var key in game.tools) dom.tools[key].innerHTML = game.tools[key]
            if (useInspect) {
                dom.tools.container.querySelectorAll(".menu-tools-selectedTool").forEach( e => e.classList.remove("menu-tools-selectedTool") )
                dom.tools.inspect.children[0].classList.add("menu-tools-selectedTool")
            }
        }
        const update = () => {
            dom.pauseWarningBar.classList[game.pause ? "remove" : "add"]("occlude")
            if (toolsOpen) updateTools()
            if (readoutOpen) updateReadout()
        }
        return {
            init : () => {
                // flags
                readoutOpen = toolsOpen = false
                // element pointers
                dom = {
                    pauseWarningBar: document.getElementById("pauseWarningBar"),
                    about: document.getElementById("menu-about"),
                    callsign: document.getElementById("menu-callsign"),
                    saveButton: document.getElementById("menu-saveButton"),
                    loadButton: document.getElementById("menu-loadButton"),
                    openShopButton: document.getElementById("menu-openButton-shop"),
                    openToolsButton: document.getElementById("menu-openButton-tools"),
                    openReadoutButton: document.getElementById("menu-openButton-readout"),
                    readout: {
                        container: document.getElementById("menu-readout"),
                        resources: document.getElementById("menu-resources"),
                        production: document.getElementById("menu-production"),
                        artifices: document.getElementById("menu-artifices"),
                        artificeItems: {},
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
                // tools: "inspect"
                dom.tools.inspect = createHtmlElement("div",{
                    className: "menu-tools-tool flexRow menu-tools-selectedTool",
                    innerHTML: "<div class='menu-tools-tool-label'>INSPECT &ofcir;</div>"
                })
                dom.tools.container.appendChild(dom.tools.inspect)
                dom.tools.inspect.onclick = event => {
                    dom.tools.container.querySelectorAll(".menu-tools-selectedTool").forEach( e => e.classList.remove("menu-tools-selectedTool") )
                    dom.tools.inspect.children[0].classList.add("menu-tools-selectedTool")
                    Input.setSelectedTool(null)
                    Input.setClickMode(0)
                }
                // inventoried tools
                for (let key in Tools) {
                    let toolElement = createHtmlElement("div",{
                        className: "menu-tools-tool flexRow",
                        innerHTML: `<div class="menu-tools-tool-label">${Tools[key].name}</div><div class="menu-tools-tool-quantity">0</div>`
                    })
                    dom.tools.container.appendChild(toolElement)
                    toolElement.onclick = event => {
                        dom.tools.container.querySelectorAll(".menu-tools-selectedTool").forEach( e => e.classList.remove("menu-tools-selectedTool") )
                        if (!Input.setSelectedTool(key) || game.tools[key] === 0) {
                            Input.setClickMode(0)
                            dom.tools.inspect.children[0].classList.add("menu-tools-selectedTool")
                        }
                        else {
                            Input.setClickMode(game.tools[key] ? 1 : 0)
                            toolElement.children[0].classList.add("menu-tools-selectedTool")
                        }
                    }
                    dom.tools[key] = toolElement.children[1]
                }
                // set behavior
                dom.about.onclick = event => {
                    game.pause = true
                    CloneHelp.open()
                }
                dom.callsign.onfocus = Input.disable
                dom.callsign.onblur = Input.enable
                dom.callsign.oninput = event => game.callsign = event.target.value
                dom.saveButton.onclick = save
                dom.loadButton.onclick = () => {
                    document.getElementById("loadDialog").classList.remove("occlude")
                }
                document.getElementById("loadDialog-exit").onclick = () => {
                    document.getElementById("loadDialog").classList.add("occlude")
                }
                document.getElementById("loadFileInput").onchange = readLoadFile
                dom.openShopButton.onclick = Store.open
                dom.openReadoutButton.onclick = Menu.toggle.readout
                dom.openToolsButton.onclick = Menu.toggle.tools
            },
            update : update,
            updateTools : updateTools,
            updateArtifices : updateArtifices,
            toggle : {
                tools: () => {
                    dom.openToolsButton.classList.toggle("menu-openButton-opened")
                    toolsOpen = !dom.tools.container.classList.toggle("occlude")
                    updateTools()
                    Artist.resize()
                },
                readout: () => {
                    dom.openReadoutButton.classList.toggle("menu-openButton-opened")
                    readoutOpen = !dom.readout.container.classList.toggle("occlude")
                    updateReadout()
                    Artist.resize()
                }
            }
        }
    })()


    const CloneUI = (function() {
        var dom, id, uid
        const show = () => {
            dom.container.classList.remove("occlude")
            Artist.resize()
        }
        const hide = (clear) => {
            if (!dom.container.classList.contains("occlude")) {
                dom.container.classList.add("occlude")
                Artist.resize()                
            }
            let highlight = spriteMap.get("cloneHighlight")
            if (highlight) highlight.destroy()
            if (clear) id = null
        }
        const applyAugmentations = () => {
            let clone = cloneMap.get(id)
            Array.from(dom.augmentations.pending.children).map( e => e.dataset.key ).forEach( augKey => {
                Augmentations[augKey].use(clone)
                clone.augmentations[augKey] = 1
                game.augmentations[augKey] -= 1
            })
            updateAugmentations()
            update()
            clone.draw()
        }
        const _augElem = (key,quantity) => {
            let augElem = createHtmlElement("div",{
                className: "cloneUI-augmentations-item flexRow",
                innerHTML: `<div class="cloneUI-augmentations-item-name">${Augmentations[key].name}</div><div class="cloneUI-augmentations-item-count">${quantity}</div>`
            })
            augElem.dataset.key = key
            return augElem
        }
        const updateAugmentations = () => {
            if (!id) return null
            let clone = cloneMap.get(id)
            if (!clone) hide(true)
            while (dom.augmentations.available.firstElementChild) dom.augmentations.available.removeChild(dom.augmentations.available.firstElementChild)
            while (dom.augmentations.pending.firstElementChild) dom.augmentations.pending.removeChild(dom.augmentations.pending.firstElementChild)
            while (dom.augmentations.applied.firstElementChild) dom.augmentations.applied.removeChild(dom.augmentations.applied.firstElementChild)
            for (let key in game.augmentations) if (game.augmentations[key]) {
                let available = _augElem(key,game.augmentations[key])
                dom.augmentations.available.appendChild(available)
                available.onclick = event => {
                    if (!game.augmentations[key]) throw new Error("should not happen")
                    // aug exists as applied or pending
                    if (clone.augmentations[key] || Array.from(dom.augmentations.pending.children).find(e=>e.dataset.key==key)) return null
                    // aug not compatible with alien spliced
                    if (clone.alienSpliced && key.indexOf("alien") === -1) return null
                    available.children[1].innerHTML = parseInt(available.children[1].innerHTML) - 1
                    let pending = _augElem(key,"")
                    dom.augmentations.pending.appendChild(pending)
                    pending.onclick = () => {
                        available.children[1].innerHTML = parseInt(available.children[1].innerHTML) + 1
                        dom.augmentations.pending.removeChild(pending)
                    }
                }
            }
            for (var k in clone.augmentations) dom.augmentations.applied.appendChild(_augElem(k,""))
        }
        const update = (setId) => {
            var clone = null
            if (setId) {
                clone = cloneMap.get(setId)
                if (id !== setId || uid !== clone.uid) {
                    id = setId
                    uid = clone.uid
                    new Array("clones","mutant","foreign").forEach( classPart => dom.container.classList.remove(`border-${classPart}`) )
                    // update once:
                    new Sprites.cloneHighlight(clone)
                    dom.container.style.border = `4px solid ${clone._color}`
                    dom.info.name.innerHTML = clone.name
                    dom.info.generation.innerHTML = clone.generation
                    updateAugmentations()
                    show()
                }
            }
            else if (!id) return null
            else {
                clone = cloneMap.get(id)
                if (!clone || clone.uid !== uid) return hide(true)
            }
            // always update:
            dom.info.age.innerHTML = clone.age
            dom.info.maxAge.innerHTML = clone.maxAge
            dom.info.fertileAge.innerHTML = clone.fertileAge
            dom.info.production.innerHTML = numberToCurrency(clone.production)
            dom.info.lifetimeProduction.innerHTML = numberToCurrency(clone.lifetimeProduction)
            dom.info.cloningRate.innerHTML = `${((1 - clone.cloningFailureChance)*100).toFixed(2)}%`
            dom.info.descendants.innerHTML = clone.descendants
        }
        const init = () => {
            dom = {
                container: document.getElementById("cloneUI"),
                close: document.getElementById("cloneUI-close"),
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
                    fertileAge: document.getElementById("cloneUI-info-fertileAge"),
                    generation: document.getElementById("cloneUI-info-generation"),
                    production :document.getElementById("cloneUI-info-production"),
                    lifetimeProduction: document.getElementById("cloneUI-info-lifetimeProduction"),
                    cloningRate: document.getElementById("cloneUI-info-cloningRate"),
                    descendants: document.getElementById("cloneUI-info-descendants")
                }
            }
            // behavior
            dom.augmentations.applyButton.onclick = applyAugmentations
            dom.close.onclick = hide
        }
        return {
            init : init,
            update : update,
            updateAugmentations : updateAugmentations,
            clear : () => hide(true),
        }
    })()


    // CLONE CLASS
    
    function Clone(xHash,yHash,override) {
        override = override || {}
        this.xHash = xHash
        this.yHash = yHash
        this.id = `${this.xHash.toString()}_${this.yHash.toString()}`
        this.uid = override.uid || `${this.id}_${game.steps.toString()}`
        this.yOdd = override.yOdd || Math.abs(this.yHash%2) === 1 ? 1 : 0
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
        this.name = override.name || [
            this.nameLexicon.FIRST[Math.floor(Math.random()*this.nameLexicon.FIRST.length)],
            this.nameLexicon.MIDDLE[Math.floor(Math.random()*this.nameLexicon.MIDDLE.length)],
            this.nameLexicon.LAST[Math.floor(Math.random()*this.nameLexicon.LAST.length)]
        ].join(" ")
        this.age = override.age || 0
        this.maxAge = override.maxAge || 50
        this.generation = override.generation || 1
        // type
        this.mutant = override.mutant !== undefined ? override.mutant : (Math.random() > 1 - this.generation / 1e7 ? true : false)
        this.foreign = override.foreign || false
        // augmentations
        this.augmentations = override.augmentations || {}
        // cloning
        this.fertileAge = override.fertileAge || 20
        this.cloningFailureChance = override.cloningFailureChance || (0.965 * (this.mutant ? 0.99 : 1))
        // production
        this.production = override.production || ( (this.mutant||this.foreign) ? 0 : (override.production || 0.005) )
        this.lifetimeProduction = override.lifetimeProduction || 0
        this.descendants = override.descendants || 0
        this.radius = this.maxRadius*0.7
        this._drawn = false
        // was from a load (had a UID)
        if (override.uid) {
            this._color = override._color
        }
        // overrides may exist, but this is a new clone)
        else {
            if (this.mutant) {
                let _rb = Math.floor(Math.random()*100+90)
                this._color = `rgb(${_rb},${Math.floor(Math.random()*20)},${_rb})`
                game.extantMutant += 1
            }
            else if (this.foreign) {
                this._color = `rgb(${Math.floor(Math.random()*100+100)},${Math.floor(Math.random()*20)},${Math.floor(Math.random()*20)})`
                game.extantForeign += 1
            }
            else {
                this._color = `rgb(${Math.floor(Math.random()*20)},${Math.floor(Math.random()*100 + 100)},${Math.floor(Math.random()*20)})`
                game.extantClones += 1
                // alien spliced!
                if (override.alienSpliced) {
                    this.alienSpliced = true
                    this.production = 2.07
                    this.fertileAge = 2265
                    this.cloningFailureChance = 0.9997
                    this.maxAge = 2273
                    this._color = `rgb(${Math.floor(Math.random()*40+120)},${Math.floor(Math.random()*40+160)},${Math.floor(Math.random()*40+130)})`
                }
            }
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
        var hereditaryTraits = {
            generation: this.generation+1,
            foreign: this.foreign,
            alienSpliced: this.alienSpliced
        }
        if (this.augmentations.geneticResequencingNodules) hereditaryTraits.mutant = false
        else if (this.mutant) hereditaryTraits.mutant = true
        new Clone(hash.x, hash.y, hereditaryTraits)
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
            if (Object.keys(this.augmentations).length) Artist.outlineCircle(this.worldPosition.x,this.worldPosition.y,this.radius-0.05,0.1,"#0F0")
        }
    }
    Clone.prototype.step = function(){
        // aging
        this.age += 1
        if (this.age > this.maxAge) return this.perish()
        // clone self
        if (this.age > this.fertileAge && Math.random() > this.cloningFailureChance) return this.clone()
        // augmented behavior
        // if (this.augmentations.allelopathicDeathTendrils && Math.random() > 0.9) {
            //     let p = this._getRandomPosition()
        // }
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

    const Sprites = {
        _SEED:0
    }
    // -- WORLD BOUNDARY --
    Sprites.worldBoundary = function() {
        this.id = "worldBoundary"
        this.draw()
        spriteMap.set(this.id,this)
    }
    Sprites.worldBoundary.prototype.draw = function() {
        Artist.outlineCircle(0,0,game.worldRadius+0.5,0.05,"rgb(117, 120, 138)")
    }
    Sprites.worldBoundary.prototype.step = function() {
        return null
    }
    // -- CLONE HIGHLIGHT --
    Sprites.cloneHighlight = function(clone) {
        this.id = "cloneHighlight"
        this.clone = clone
        this.draw()
        spriteMap.set(this.id,this)
    }
    Sprites.cloneHighlight.prototype.draw = function() {
        Artist.outlineCircle(this.clone.worldPosition.x,this.clone.worldPosition.y,this.clone.radius+0.05,0.1,"#07F")
    }
    Sprites.cloneHighlight.prototype.destroy = function() {
        Artist.clipCircle(this.clone.worldPosition.x,this.clone.worldPosition.y,this.clone.maxRadius)
        // for (var p = 0; p < 6; p++) {
        //     var hash = this.clone._getHashFromPosition(p)
        //     var neighbor = cloneMap.get(`${hash.x}_${hash.y}`)
        //     if (neighbor) neighbor.draw()
        // }
        spriteMap.delete("cloneHighlight")
        let clone = cloneMap.get(`${this.clone.xHash}_${this.clone.yHash}`)
        if (clone) clone.draw()
    }
    Sprites.cloneHighlight.prototype.step = function() {
        return null
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
            cost: 3.65,
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
            description: "By jetisoning organic tissue into a high-energy control ray, an entire group of clones can be grotesquely reanimated... I mean beautifully, er, coalesced back to their, uh, intended forms.",
            cost: 45.50,
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
            description: "Instantly eliminate a single clone.",
            cost: 19.95
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
            cost: 55
        },
        cascadeResonanceQuantumWarhead: {
            use: () => {
                cloneMap.forEach( clone => clone.perish() )
                return true
            },
            name: "Cascade Resonance Quantum Warhead",
            description: "The Cascade Resonance Quantum Warhead (CRQW) is the finest world-refreshing armament on the market.  Nothing survives, guaranteed.",
            cost: 6669.99
        },
    }

    // AUGMENTATIONS
    var Augmentations = {
        ribonucleicInjection: {
            use: clone => {
                clone.maxAge += 500
            },
            name: "Ribonucleic Injection",
            description: "<div class='storeDescEffect'>Max Age +500</div>Prolong -- wait, sorry, our mistake -- <i>extend</i> the happy, very happy, life of a clone!",
            cost: 10.50
        },
        psychicHarness: {
            use: clone => {
                clone.production += 0.09
            },
            name: "Psychic Harness",
            description: `<div class='storeDescEffect'>Production +0.09</div>Make no mistake, that little "+0.07" is pushing them to their breaking point.  You know, "psychologically" speaking.`,
            cost: 15.99
        },
        longevityPump: {
            use: clone => {
                clone.maxAge *= 9
            },
            name: "Longevity Pump",
            description: "<div class='storeDescEffect'>Max Age x9</div>Works great!  And trust us, they barely notice the pump.  In fact, uh, clones love it.  Don't ask them about it though, they're selfish and would probably just want the next step up in our product line and seriously, who can afford that?  Oh but if you could, oh man.  That's the stuff.",
            cost: 90
        },
        orificeInterconnectivitySystem: {
            use: clone => {
                clone.production *= 4
            },
            name: "Orifice Interconnectivity System",
            description: "<div class='storeDescEffect'>Production x4</div>This system ingeniously interconnects a clone's orifices, filtering and recycling waste directly back into the clone. Ah, the circle of life!",
            cost: 175
        },
        organicTransmutation: {
            use: clone => {
                clone.production *= 7
            },
            name: "Organic Transmutation",
            description: `<div class='storeDescEffect'>Production x11</div>While this modification is, well, "difficult" on the clone, the potential rewards are fantastic.  For you.`,
            cost: 999.99
        },
        sterilizationClamp: {
            use: clone => {
                clone.fertileAge = Infinity
            },
            name: "Sterilization Clamp",
            description: `<div class="storeDescEffect">Fertility Age &rarr; <b>&infin;</b></div>This non-surgical method inhibits production of reproductive biochemicals in a clone. You may notice they plump up a bit without a sex drive. The clamps are self-installing, so just place one within the vicinity of a clone and step back (way back).`,
            cost: 5e3
        },
        mtbde: {
            use: clone => {
                clone.cloningFailureChance -= 0.01
            },
            name: "MTBDE",
            description: `<div class="storeDescEffect">Cloning Rate +1%</div>Methyl-tribromodioxylic Ether (MTBDE) is an "all-natural" way of enhancing a clone's... reproductive capabilities.`,
            cost: 34e3
        },
        geneticResequencingNodules: {
            use: clone => {},
            name: "Genetic Resequencing Nodules",
            description: "<div class='storeDescEffect'>Mutation factor &rarr; 0</div>Only the finest implanted nodules crafted from 100% reprocessed... material.  Allows clone's organic sequences to stay intact, preventing mutant offspring (is that a paradox? hahahaha....).  Descendents do not inherit this augmentation.",
            cost: 100e3
        },
        alienMotivationBioimplant: {
            use: clone => {
                clone.production *= 7
                if (!clone.alienSpliced) clone.maxAge /= 20
            },
            name: "Alien Motivational Bioimplant",
            description: `<div class="storeDescEffect">Production x7</div><div class="storeDescEffect">Max Age x1/20 (non-alien-DNA-spliced clones)</div>We're not sure if the alien-DNA-spliced clones even feel pain so we've been doing the implant procedure sans-anaesthesia. Don't put this implant into clones without the extra alien DNA sequences, they'll, ah, <i>reject</i> the implant.`,
            cost: 330e3
        },
        immortalitySerum: {
            use: clone => {
                clone.maxAge = Infinity
                clone._color = "rgb(255,215,0)"
                clone.draw()
            },
            name: "Immortality Serum",
            description: "<div class='storeDescEffect'>Max Age &rarr; <b>&infin;</b></div>Literally, no shit, your clone will be immortal.  Will do nothing for their temperment, however.",
            cost: 900e3
        },
        cyberneticGenitals: {
            use: clone => {
                clone.fertileAge = Math.round(clone.fertileAge/2)
                clone.cloningFailureChance -= 0.015
            },
            name: "Cybernetic Genitals",
            description: `<div class="storeDescEffect">Cloning Rate +1.5%</div><div class="storeDescEffect">Fertility Age x1/2</div>Once the swelling goes down and the risk of deadly infection has passed, you know the "upgrade" has been successful, so just kick back and... ahem... watch the fireworks.`,
            cost: 5e6
        },
        allelopathicDeathTendrils: {
            use: clone => {},
            name: "Allelopathic Death Tendrils",
            description: "Gives your clone an automatic defense net that will strike out at dissimilar clones. What could go wrong?",
            cost: 7e6
        },
        exophagicAfterbirth: {
            use: clone => {},
            name: "Exophagic Afterbirth",
            description: "How to put it?  Ahhh... Part of the, er, cloning process, umm, allows dissimilar clones to be *ahem* consumed. You may opt to not watch this miracle of science. Actually, nobody should see this.  In fact, this augmentation also blinds the clone.  It was the only humane thing to do.",
            cost: 12e6
        },
        hereditaryServitudeEngrams: {
            use: clone => {},
            name: "Hereditary Servitude Engrams",
            description: "<div class='storeDescEffect'>Max Age +110 (descendants)</div><div class='storeDescEffect'>Production +0.005 (descendants)</div><div class='storeDescEffect'>+Hereditary Servitude Engrams (descendants)</div>Descendants will posses genotypes that increases longevity and productivity (they just won't know it).",
            cost: 390e6
        },
        progenicResequencing: {
            use: clone => {},
            name: "Progenic Resequencing",
            description: `<div class='storeDescEffect'>+Genetic Resequencing Nodules (descendants)</div><div class='storeDescEffect'>+Progenic Resequencing (descendants)</div>You know the old adage, "the apple never falls far from the tree"?  Well, now the apple will fall with subatomic-level precision, ensuring, um, I'm not sure exactly where this analogy is going but let's just say the clones might start looking a little, uh, even <i>more</i> homogenous.`,
            cost: 3.7e9
        },
        exophagicOffspring: {
            use: clone => {},
            name: "Exophagic Offspring",
            description: "<div class='storeDescEffect'>+Exophagic Afterbirth (descendants)</div><div class='storeDescEffect'>+Exophagic Offspring (descendants)</div>They're gunna f*ck sh*t up. Don't say we didn't warn you. Just don't make any godamned immortal exophagic nightmare clonepacolypse vampclones",
            cost: 999e9
        },
    }

    var Artifices = {

        netsOfUrizen: {
            use: () => {},
            name: "Nets of Urizen",
            description: `<div class='storeDescEffect'>+.01 Production per living clone</div>
                <i>
                    Of the primeval Priests assum'd power,<br>
                    When Eternals spurn'd back his religion;<br>
                    And gave him a place in the north,<br>
                    Obscure, shadowy, void, solitary.<br>
                    Eternals I hear your call gladly,<br>
                    Dictate swift winged words, & fear not<br>
                    To unfold your dark visions of torment.<br>
                </i>-William Blake`,
            cost: 10e3
        },
        bookOfUrizen: {
            use: () => {},
            name: "Book of Urizen",
            description: `<div class='storeDescEffect'>+.02 Production per living clone</div>
                <i>
                    Lo, a shadow of horror is risen<br>
                    In Eternity! Unknown, unprolific!<br>
                    Self-closd, all-repelling: what Demon<br>
                    Hath form'd this abominable void<br>
                    This soul-shudd'ring vacuum? — Some said<br>
                    "It is Urizen", But unknown, abstracted<br>
                    Brooding secret, the dark power hid.<br>
                </i>-William Blake`,
            cost: 200e3
        },
        lightOfUrizen: {
            use: () => {},
            name: "Light of Urizen",
            description: `<div class='storeDescEffect'>+.05 Production per living clone</div>
                <i>
                    In anguish dividing & dividing<br>
                    For pity divides the soul<br>
                    In pangs eternity on eternity<br>
                    Life in cataracts pourd down his cliffs<br>
                    The void shrunk the lymph into Nerves<br>
                    Wand'ring wide on the bosom of night<br>
                    And left a round globe of blood<br>
                    Trembling upon the Void<br>
                </i>-William Blake`,
            cost: 70e6
        },
        laborOfUrizen: {
            use: () => {},
            name: "Labor of Urizen",
            description: `<div class='storeDescEffect'>+.01 Production per living clone of any type</div>
                <i>
                    They began to weave curtains of darkness<br>
                    They erected large pillars round the Void<br>
                    With golden hooks fastend in the pillars<br>
                    With infinite labour the Eternals<br>
                    A woof wove, and called it Science<br>
                </i>-William Blake`,
            cost: 120e9
        },

        // 3
        // 1 2 3 4 -- > 13
        // 5

        microFissionEngine: {
            use: () => {
                game.worldRadius += 1
                Artist.redraw()
            },
            name: "Micro Fission Engine",
            description: "<div class='storeDescEffect'>World Radius +1</div>Although it's not enough to improve the clones' quality of life, it is enough to cram a few more of 'em in there.",
            cost: 760.55
        },
        redMercuryCyclotronEngine: {
            use: () => {
                game.worldRadius += 2
                Artist.redraw()
            },
            name: "Red Mercury Cyclotron Engine",
            description: "<div class='storeDescEffect'>World Radius +2</div>",
            cost: 2.3e3
        },
        cobaltFusionEngine: {
            use: () => {
                game.worldRadius += 3
                Artist.redraw()
            },
            name: "Cobalt Fusion Engine",
            description: "<div class='storeDescEffect'>World Radius +3</div>Powered by cobalt fusion, the modern standard in energy delivery systems. The fusion chain produces only high-grade Terbium as a byproduct (and some high-intesity beta radiation, but the clones will soak most of that up).",
            cost: 9.2e3
        },
        hyperstaticInductionEngine: {
            use: () => {
                game.worldRadius += 4
                Artist.redraw()
            },
            name: "Hyper-static Induction Engine",
            description: "<div class='storeDescEffect'>World Radius +4</div>We believe no stone should be left unturned, and we really turned up an ant-nest with this one.  Highly unstable but who can argue with the price?",
            cost: 20e3
        },
        bioschismaticExtractionEngine: {
            use: () => {
                game.worldRadius += 5
                Artist.redraw()
            },
            name: "Bioschismatic Extraction Engine",
            description: "<div class='storeDescEffect'>World Radius +5</div>Directly harnesses the clones bioenergy.  Just give 'em an extra half scoop of feed at night, they'll be fine.",
            cost: 77e3,
        },
        leptonRuptureEngine: {
            use: () => {
                game.worldRadius += 6
                Artist.redraw()
            },
            name: "Lepton Rupture Engine",
            description: "<div class='storeDescEffect'>World Radius +6</div>The best part about this engine is the maelstrom of superheated plasma. You can pretty much just toss stuff in from the observation deck and watch it erupt in a shower of flames! Not saying that an overabundance of clones should provide fodder for that sort of purile behavior but....",
            cost: 77e3,
        },
        darkEnergyTransmutationEngine: {
            use: () => {
                game.worldRadius += 7
                Artist.redraw()
            },
            name: "Dark Energy Transmutation Engine",
            description: "<div class='storeDescEffect'>World Radius +7</div>Dirty whore of a cocksucker works great!",
            cost: 1.5e6
        },
        chronofilamentEngine: {
            use: () => {
                game.worldRadius += 8
                Artist.redraw()
            },
            name: "Chrono-filament Engine",
            description: "<div class='storeDescEffect'>World Radius +8</div>The inventor said the hyphen will dropped from the name in the future, but what does that egghead know? Bends spacetime (mostly the time part) to extract energy from the fabric of the universe itself. Extended use may shatter reality.",
            cost: 30e6,
        },
        hawkingCipollaExpansionLimitEngine: {
            use: () => {
                game.worldRadius += 11
                Artist.redraw()
            },
            name: "Hawking-Cipolla Expansion Limit Engine",
            description: "<div class='storeDescEffect'>World Radius +11</div>Do NOT let the clones near the glow-zone (and trust us, they're gunna want to wander in there).  They come back... changed.",
            cost: 75e9
        },

        cygniStellarFragment: {
            use: () => game.artifices.cygniStellarFragment ? 0.0000001 : 0,
            name: "Cygni Stellar Fragment",
            description: "<div class='storeDescEffect'>Alien DNA Splicing Success Rate +1</div>No promises, but we're like 99% certain that the DNA we found on this stellar fragment is alien SHHHhhh!... jesus, don't say anything here, man. Look, don't be nervous, just act casual, okay? We know it's illegal, but <i>think</i> man, think of the possibilities! Look, we already did the research. We weren't going to tell you, but one thing led to another blah blah, anyway, it happened, and now we know how to splice alien DNA with clones so... look, don't overthink this, man. Just buy this shiny, awesome, alien-DNA-impregnated stellar fragment and let's make some freakin' gray-backs!",
            cost: 5e3
        },
        glieseStellarFragment: {
            use: () => game.artifices.glieseStellarFragment ? 0.0000001 : 0,
            name: "Gliese Stellar Fragment",
            description: "<div class='storeDescEffect'>Alien DNA Splicing Success Rate +1</div>Okay, you did <i>not</i> tell anyone about this, right? 'Cause I feel like I'm being, I dunno man, being followed or something. They know about the fragments, man, I just got this feeling like GET DOWN! THEY'RE HERE GET no, sorry, man, false alarm, I thought they were coming but, seriously man, I know it's not just me, I have proof they were already there, man, they knew about it, they KNOW MAN! THEY FOUND US, WE GOTTA GET OUTA HERE JUST...<br>...Whew, did that just happen?  Sorry.  We have to flip this stellar fragment quick. Gliese has the worse biophasic radiation.",
            cost: 11e3
        },
        pleiadesStellarFragment: {
            use: () => game.artifices.pleiadesStellarFragment ? 0.0000001 : 0,
            name: "Pleiades Stellar Fragment",
            description: "<div class='storeDescEffect'>Alien DNA Splicing Success Rate +1</div>",
            cost: 65e3
        },
        westerlundStellarFragment: {
            use: () => game.artifices.westerlundStellarFragment ? 0.0000002 : 0,
            name: "Westerlund Stellar Fragment",
            description: "<div class='storeDescEffect'>Alien DNA Splicing Success Rate +2</div>",
            cost: 35e6
        },
        magellanicStellarFragment: {
            use: () => game.artifices.magellanicStellarFragment ? 0.0000004 : 0,
            name: "Magellanic Stellar Fragment",
            description: "<div class='storeDescEffect'>Alien DNA Splicing Success Rate +4</div>",
            cost: 109e6
        },
        //<div class='storeDescEffect'>Alien-spliced Clones x2 Production</div>",
    }


    // GAMEPLAY LOOP
    const gameplay = () => {
        Input.apply()
        Framerate.register()
        if (!game.pause) {
            game.steps += 1
            if (Math.random() > 0.99) {
                new Clone(
                    Math.floor( (Math.random() * 2 - 1) * game.worldRadius/Clone.prototype.xMultiplier),
                    Math.floor( (Math.random() * 2 - 1) * game.worldRadius/Clone.prototype.yMultiplier),
                    {foreign:true}
                )
            }
            cloneMap.forEach( clone => clone.step() )
            spriteMap.forEach( sprite => sprite.step() )
            // active effects / artifices
            if (game.artifices.netsOfUrizen) game.resources += game.extantClones * 0.01
            if (game.artifices.bookOfUrizen) game.resources += game.extantClones * 0.02
            if (game.artifices.lightOfUrizen) game.resources += game.extantClones * 0.05
            if (game.artifices.laborOfUrizen) game.resources += cloneMap.size * 0.01
            if (
                Artifices.cygniStellarFragment.use() +
                Artifices.glieseStellarFragment.use() +
                Artifices.pleiadesStellarFragment.use() +
                Artifices.westerlundStellarFragment.use() +
                Artifices.magellanicStellarFragment.use()
                > Math.pow(Math.random(),2)
            ) {
                new Clone(
                    Math.floor( (Math.random() * 2 - 1) * game.worldRadius/Clone.prototype.xMultiplier),
                    Math.floor( (Math.random() * 2 - 1) * game.worldRadius/Clone.prototype.yMultiplier),
                    {alienSpliced:true}
                )
            }
            // ui update
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
            view:view,
            game:game
        })
        var anchor = createHtmlElement("a", { href: "data:text/plain,"+btoa(saveData), download: `CLONE_save_${new Date().getTime()}.txt` })
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
        delete anchor
    }
    const readLoadFile = () => {
        var input = document.getElementById("loadFileInput")
        var reader = new FileReader()
        reader.onload = function(){
            load(JSON.parse(atob(reader.result)))
            document.getElementById("loadDialog").classList.add("occlude")
            input.value = ""
        }
        reader.readAsText(input.files[0])
    }

    const load = saveData => {
        saveData = saveData || {}
        cloneMap = new Map()
        spriteMap = new Map()
        view = saveData.view || {
            scale:24,
            xPos:0,
            yPos:0,
            bounds: {},
            screenSize: {}
        }
        game = saveData.game || {
            callsign:(function(){
                let c = ["Mitochondrion familiar","Type O zealot","Slugdge acolyte","inductee of The Elder","Melvin.","Acid Bath baptized","Cooper clone"]
                return c[Math.floor(Math.random()*c.length)]
            })(),
            // experience:0,
            steps:0,
            resources:0,
            extantClones:0,
            extantMutant:0,
            extantForeign:0,
            perishedClones:0,
            perishedMutant:0,
            perishedForeign:0,
            tools:{
                genesisPod: 7,
                genesisRay: 0,
                smitingBolt: 0,
                deionizer: 0,
            },
            augmentations:{},
            artifices:{},
            pause:false,
            worldRadius:3
        }
        document.getElementById("menu-callsign").value = game.callsign
        if (saveData.cloneMap) saveData.cloneMap.forEach( cloneInfo => {
            new Clone(cloneInfo.xHash,cloneInfo.yHash,cloneInfo)
        })
        new Sprites.worldBoundary()
        Artist.resize()
        Menu.update()
        Menu.updateArtifices(true)
        Framerate.reset()
        Input.enable()
    }
    
    window.cht = () => game.resources += 100e9

    return function() {
        // initialization
        CloneHelp.init()
        CloneUI.init()
        Artist.init()
        Store.init()
        Menu.init()
        // start demo with splashscreen
        Input.disable()
        load({
            view: {
                // scale:20,
                scale: Math.min(document.body.offsetWidth,document.body.offsetHeight) / 50,
                xPos:0,
                yPos:0,
                bounds: {},
                screenSize: {}
            },
            game: {
                callsign:"lemliDog",
                steps:0,
                resources:Math.random()*1e6,
                extantClones:0,
                extantMutant:0,
                extantForeign:0,
                perishedClones:0,
                perishedMutant:0,
                perishedForeign:0,
                tools:{genesisPod:0,genesisRay:0,smitingBolt:0,deionizer:0},
                augmentations:{},
                artifices:{},
                pause:false,
                worldRadius:30
            }
        })
        for (var _nClones = 0; _nClones < 200; _nClones++) new Clone(Math.round(Math.random()*40-20),Math.round(Math.random()*44-22),{
            generation:1e3,
            age:Math.floor(Math.random()*40),
            foreign:Math.random()>0.8
        })
        Menu.toggle.readout()
        let splashscreen = document.getElementById("splashscreen")
        splashscreen.onclick = () => {
            Menu.toggle.readout()
            load()
            splashscreen.parentElement.removeChild(splashscreen)
        }
        // start the gameplay loop
        gameplay()
    }

})()

window.onload = CLONE_Game


/*
ARTIFACTS (in value/order?)

ultimates (+10e12 pricetag)
need unlimited all ammo (

purchase, discover, engineer

shogoth's helix
architect's code
django's pick - toggle soundtrack
opalescent ward - 99/100 foreign spawn rate
fluorescent ward - 49/50 foreign spawn rate
viridescent ward - 9/10 foreign spawn rate
??? - 99/100 mutation rate (clones)
??? - 49/50 mutation rate (clones)
??? - 9/10 mutation rate (clones)
??? - 1/2 mutation rate
link stone - random clone spawns
aran stone - smiting bolt infinite ammo ???
freeman stone - double production and reproduction rate, half lifespan !!! ultimate
cygni stellar fragment - +0.001 chance of alien-spliced clone
gliese stellar fragment - +0.001 chance of alien-spliced clone
pleiades stellar fragment - +0.001 chance of alien-spliced clone
westerlund stellar fragment - +0.001 chance of alien-spliced clone
magellanic stellar fragment - +0.001 chance of alien-spliced clone

--------------
 word dungeon
--------------

*/