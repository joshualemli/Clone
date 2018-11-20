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
            CLONE is an automata-driven game.
        </div>
        <div>
            Like life, there is no real purpose, other than for you to figure out your own purpose.
            Like life, exploration is key!  Unlike life, this is a simulation and you may
            do as you please without any (real life) consequences.  Clones may die, but... whatever.
        </div>
        <div>
            Do you feel for the clones?  Do you?
        </div>
        <div>
            This game was created by Joshua A. Lemli; he had to write it, he had to, he had no choice.
            It was coded intermittently over the course of two spastic weeks and will be refined for who knows how long.
        </div>
        <div>
            contact:
            joshualemli@gmail.com
        </div>
    `
    content["Basics / Getting Started"] = `
        <div>
            The game revolves around clones, which for all you care are just cells/dots/entities that have a chance to reproduce ("clone" themselves).
            The clones exist within the "world", which is basically a big circle on your screen.
            This is the clones' world.  It is all they will ever know.
        </div>
        <div>
            There are no rules to the gameplay. It's important to try new things.  <b>Exploration is key!</b>
        </div>
        <div>
            Basically you create, destroy, and augment clones.  And watch them reproduce and die.
            You can also buy <i>artifices</i> that permanently alter gameplay, typically in your favor.
        </div>
        <div>
            Although there is no dying/losing in this game, starting out can be tricky.
            If you have no living "normal" clones (colored green) and
            you have zero resources, producing resources is most likely (but not definitely)
            impossible and you may no longer have any means to interact with the world.
            You may restart (simply reload the page) or load a saved game at any time.
            You can check the <i>Readout</i> or <i>The Money Pit</i> at any time to see your current resources.
        </div>
        <div>
            One you get going, however, getting "stuck" becomes virtually impossible, especially with
            the ability to save and reload your game at any point.
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
            <span class="helpKey">t</span> toggle "Tools" interface
            <br>
            <span class="helpKey">r</span> toggle "Readout"
            <br>
            <span class="helpKey">s</span> open "The Money Pit" store
            <br>
            <span class="helpKey">any key</span> close "The Money Pit" store (while open)
        </div>
    `
    content["Main Menu"] = `
        <div>
            At the top of your screen is a menu with several interactive items, such as the tools interface.
            You can click on the button labeled "Tools" to open the tools interface.  You can also open
            your readout, open a store called "The Money Pit" (don't worry, the currency is virtual),
            change your player's name, and save/load the game.
        </div>
    `
    content["Clones"] = `
        <div>
            Clones come in three basic flavores: regular, foreign, and mutant.  All clones are governed by a simple set of rules.
            They age and die.  They can have offspring based on their fertility age and chance to reproduce.  They can be augmented.
            The life of most clones is short and relatively meaningless.
        </div>
        <div>
            Some clones will produce revenue.  Check your readout to see total production.
        </div>
        <div>
            Clones can be created in three main ways.  They can be placed on the world/map by you using a tool, they can spawn
            randomly, or they can have offspring.
        </div>
        <div>
            "Regular" clones are green, and are the primary type of clone you will create.  Regular clones do not (typically) randomly spawn,
            but must be generated with a tool like a <i>Genesis Pod</i>. Regular clones will earn revenue.
        </div>
        <div>
            "Foreign" clones are red, and are constanly randomly spawning.  While they do not directly consume resources, they
            occupy space on the world that could otherwise be utilized by your own precious clones.
        </div>
        <div>
            "Mutant" clones are purple, and have an increasing chance of occurring as clones increase in generation.
            Mutant clones can spawn from regular or foreign clones any time they reproduce.
            Certain artifices and augmentations can change the generational latency or likelihood of the mutagenic factor.
        </div>
    `
    content["The Money Pit"] = `
        <div>
            No actual money required -- rather, clones that "produce" revenue will fill your coffer.
            Open the store by clicking on "The Money Pit" link on the main menu.
            Pick an item to see item details and make a purchase.
            No refunds.
        </div>
        <div>
            Artifices are unique items; only one of each type of artifice may be purchased.
        </div>
    `
    content["Tools"] = `
        <div>
            Tools can purchased from <i>The Money Pit</i>. The tools interface is opened by
            selecting the "Tools" button in the main menu.  Once opened, you can select a
            tool to use.  Click on the world to use the tool.
        </div>
        <div>
            The "Inspect" tool is the default tool and is crucial to the game as it allows
            you to apply augmentations to clones.  The inspect tool is unique because it does not need to be
            purchased or refilled at the store.
        </div>
        <div>
            Another important tool is the <i>genesis pod</i>.  This is your only starting
            item and your only initial way to earn revenue (<i>i.e.</i> by placing some clones).
            Open the tools interface, select "Genesis Pod", and click inside the world on an empty
            space to create a new clone.
        </div>
        <div>
            I'll leave the rest of the tools for you to explore on your own.
        </div>
    `
    content["Augmentations"] = `
        <div>
            Augmentations modify a clone's behavior.  Only one augmentation of each type can
            be applied to a clone.  Augmentations are permanent, and their effects are applied in
            the order that you apply the augmentations.
            You can purchase augmentations at <i>The Money Pit</i>.
        </div>
        <div>
            To apply augmentations, you must first inspect a living clone using the "Inspect" tool.
            After the clone has been selected, you can click on any augmentations
            in the "available" list (remember to purchase some first) to add them to the "pending" list.
            To remove a pending augmentation, simply click it.
            Once you put the desired augmentations into the "pending" list, click the squiggly arrow button to apply them.
            Remember that once applied, augmentations cannot be undone!
        </div>
    `
    content["Artifices"] = `
        <div>
            Artifices permanently alter gameplay in a variety of ways.  Most are available for purchase in <i>The Money Pit</i>.
            Some artifices are bestowed for achieving certain milestones within the game.
            All artifices are unique and only one can be owned of each type.
        </div>
        <div>
            The effects of artifices range greatly, but one of the most important aspects of gameplay
            is to increase the size of the "world".  This is done most readily by purchasing any of the
            "Engine" type artifice.  The benefits and challenges of increasing the world size are
            not altogether trivial (or obvious).  Enjoy.
        </div>
    `
    content["Readout"] = `
        <div>
            The readout is available by clicking the "Readout" button in the main menu.
            Your production, current resources, and clone counts are reflected in the readout.
        </div>
    `
    content["Saving and Loading"] = `
        <div>
            To <b>save</b> a game, click the "Save" button in the main menu.  This will generate a small
            save file that you can then download.  The file is just plain text!
        </div>
        <div>
            To <b>load</b> a game, click the "Load" button in the main menu.  A dialog will appear where
            you can select a saved game file generated using the 'save' feature mentioned above.
            The file will automagically load once selected.
        </div>
    `
    content["Strategy"] = `
        <div>
            Although there is no "goal" to this game, you can start with the "SGR" ecological model --
            survive, grow, and reproduce.  This means getting some (green/normal) clones and producing
            some resouces so you can do new stuff.
        </div>
        <div>
            Start by opening the <i>readout</i> and <i>tools</i> interface. Select the "Genesis Pod" tool
            and drop some clones down onto the world. If you get lucky, you'll get a little clone colony and make enough money
            to buy some more genesis pods and an augmentation or two.  This is the key!  Apply augmentations
            as soon as possible -- they are more efficient than simply creating more clones.
        </div>
        <div>
            Once you have that down, you should be able to purchase more expensive items and your freedom
            to experiment will increase dramatically.
        </div>
        <div>
            While there are moments (like the beginning of a new game) when you may want to micromanage,
            this game is intended to be played casually.  Your clones are not special (sorry), and if they die,
            so be it.  Feel free to play however you like, but bear in mind that certain strategies will
            more conducive to laissez-faire gameplay than others.
            The rules that govern unadorned gameplay are meant to bent, and in some cases, broken.
        </div>
        <div>
            Last, remember to save your game, especially if you feel you've reached a milestone or are about to
            try something new (or unsavory).  There are no consequences to saving and loading often.
        </div>
    `

    const open = () => {
        dom.container.classList.remove("occlude")
    }
    const close = () => {
        dom.container.classList.add("occlude")
    }

    const setTopic = topic => {
        dom.topic.innerHTML = `<div id="helpTopicTitle">${topic}</div>${content[topic]}`
        Array.from(dom.topic.children).forEach( (child,index) => {
            if (index > 0) child.classList.add("helpParagraph")
        })
        Array.from(dom.sections.children).forEach( sectionItem => {
            sectionItem.classList.remove("helpSectionSelected")
            if (sectionItem.dataset.topic === topic) sectionItem.classList.add("helpSectionSelected")
        })
    }


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
            e.dataset.topic = topic
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

