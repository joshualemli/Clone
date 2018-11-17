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


    CLONE JavaScript help file
    v0.1


*/

"use strict";

const CloneHelp = (function(){

    var dom

    const content = {}
    content["Welcome"] = `
        <div>
            CLONE is an autamata-driven game.  Like life, it has no real
            purpose, other than for you to figure out some purpose.  Like life,
            exploration is key!  Unlike life, this is a simulation and you're free
            to do as you please without (real life) consequences.
        </div>
    `
    content["Basics / Getting Started"] = `
        <div>
            The game revolves around clones, which are little dots that have a chance to reproduce ("clone" themselves).
            The clones exist within the "world", which is basically a circle on your screen.
            This is the clones' world.  This is all they know.
        </div>
        <div>
            There are no rules to gameplay. Basically you can create, destroy, and augment clones.
            If you have no living "normal" clones (colored green) and
            you have zero resources, progressing is most likely (but not definitely)
            impossible and you may no longer have any means to interact with the gameplay.
            You may restart or load a game at any time.
            You can check the <i>Readout</i> or <i>The Money Pit</i> at any time to see your current resources.
        </div>
        <div>
            At the top of your screen is a menu with several interactive items, such as tools.
            You can click on the button labeled "Tools" to open the tools interfact.  You can
            also open a store called "The Money Pit" (don't worry, the currency is virtual),
            change your player's name, and more.  Exploration is key!
        </div>
    `
    content["User Input"] = `
        <div>
            <span class="helpKey">mouse click</span> use tool
            <br>
            <span class="helpKey">space</span> pause / resume
            <br>
            <span class="helpKey">+</span> <span class="helpKey">-</span> <span class="helpKey">mouse wheel</span> zoom in / out
            <br>
            <span class="helpKey">0</span> recenter view
            <br>
            <span class="helpKey">s</span> open "The Money Pit" store
            <br>
            <span class="helpKey">any key</span> close "The Money Pit" store (while open)
        </div>
    `
    content["Clones"] = `
        <div>
            Clones are the circles you see 
        </div>
        <div>
            Green "normal" clones are the primary type of clone you will create.  Green clones do not (typically) randomly spawn.
        </div>
    `
    content["The Money Pit"] = ``
    content["Tools"] = ``
    content["Augmentations"] = ``
    content["Readout"] = ``
    content["Saving and Loading"] = ``
    content["Tips"] = ``

    const open = () => {
        dom.container.classList.remove("occlude")
    }
    const close = () => {
        dom.container.classList.add("occlude")
    }

    const setTopic = topic => dom.topic.innerHTML = `<div id="helpTopicTitle">${topic}</div>${content[topic]}`


    const init = () => {
        // html elements
        dom = {
            container: document.getElementById("helpDialog"),
            sections: document.getElementById("helpSections"),
            topic: document.getElementById("helpTopic"),
        }
        // set content and behavior
        document.getElementById("helpVersion").innerHTML = `v${CLONE_VERSION}`
        for (let topic in content) {
            let e = document.createElement("div")
            e.innerHTML = topic
            e.className = "helpSectionItem"
            dom.sections.appendChild(e)
            e.onclick = () => setTopic(topic)
        }
        setTopic("Welcome")
        document.getElementById("helpExit").onclick = close
    }

    return {
        init:init,
        open:open
    }

})()

