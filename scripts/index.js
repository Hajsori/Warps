// ©️ 2025 Hajsori. All Rights Reserved.

import * as Minecraft from "@minecraft/server"
import * as MinecraftUi from "@minecraft/server-ui"


Minecraft.world.afterEvents.playerJoin.subscribe(() => {
    try {
        Minecraft.world.scoreboard.addObjective("warps:data", "Warps Data")
    } catch { }
})

Minecraft.system.beforeEvents.startup.subscribe((event) => {
    console.info("[WARPS!] Loaded Script")


    event.customCommandRegistry.registerCommand(
        {
            name: "warps:warp",
            description: "Warp to a specific location",
            permissionLevel: Minecraft.CommandPermissionLevel.Any
        },
        (origin) => {
            Minecraft.system.run(() => {
                if (origin.sourceType == Minecraft.CustomCommandSource.Entity && origin.sourceEntity.typeId == "minecraft:player") {
                    showWarpMenu(origin.sourceEntity)
                } else if (origin.sourceType == Minecraft.CustomCommandSource.NPCDialogue && origin.initiator.typeId == "minecraft:player") {
                    showWarpMenu(origin.initiator)
                }
            })
        }
    )

    event.customCommandRegistry.registerCommand(
        {
            name: "warps:addwarp",
            description: "Add a new Warp",
            permissionLevel: Minecraft.CommandPermissionLevel.GameDirectors
        },
        (origin) => {
            Minecraft.system.run(() => {
                if (origin.sourceType == Minecraft.CustomCommandSource.Entity && origin.sourceEntity.typeId == "minecraft:player") {
                    addWarpMenu(origin.sourceEntity)
                } else if (origin.sourceType == Minecraft.CustomCommandSource.NPCDialogue && origin.initiator.typeId == "minecraft:player") {
                    addWarpMenu(origin.initiator)
                }
            })
        }
    )

    event.customCommandRegistry.registerCommand(
        {
            name: "warps:removewarp",
            description: "Remove a Warp",
            permissionLevel: Minecraft.CommandPermissionLevel.GameDirectors
        },
        (origin) => {
            Minecraft.system.run(() => {
                if (origin.sourceType == Minecraft.CustomCommandSource.Entity && origin.sourceEntity.typeId == "minecraft:player") {
                    removeWarpMenu(origin.sourceEntity)
                } else if (origin.sourceType == Minecraft.CustomCommandSource.NPCDialogue && origin.initiator.typeId == "minecraft:player") {
                    removeWarpMenu(origin.initiator)
                }
            })
        }
    )


    event.itemComponentRegistry.registerCustomComponent("warps:warp_menu", {
        onUse: (event) => {
            showWarpMenu(event.source)
        }
    })
})


function showWarpMenu(player) {
    let actionForm = new MinecraftUi.ActionFormData()
        .title("§r§dWarp Menu§r")

    let warps = []
    for (let warp of Minecraft.world.scoreboard.getObjective("warps:data").getParticipants()) {
        warp = JSON.parse(warp.displayName.replaceAll("\\", ""))
        if (!warp?.name || !warp?.x.toString() || !warp?.y.toString() || !warp?.z.toString() || !warp?.dimension) continue
        actionForm.button(`§r${warp.name}§r\n§fX: §8${warp.x} §fY: §8${warp.y} §fZ: §8${warp.z}§r ${warp.dimension.replace("overworld", "§r§2Overworld§r").replace("nether", "§r§cNether§r").replace("the_end", "§r§5The End§r")}`)
        warps.push(warp)
    }

    actionForm
        .button("§r§cClose Menu§r")
        .show(player).then((res) => {
            if (res.canceled || res.selection == warps.length) return player.sendMessage(`§r§8[§dWarps!§8] §cCanceled Warp Teleport!§r`)

            Minecraft.world.getDimension(warps[res.selection].dimension).runCommand(`tp "${player.name}" ${warps[res.selection].x} ${warps[res.selection].y} ${warps[res.selection].z}`)
        })
}

function addWarpMenu(player) {
    new MinecraftUi.ModalFormData()
        .title("§r§8Add §dWarp§r")
        .textField("Name", "Warp 0815 (Required, String)")
        .textField("X Coordinate", `${Math.round(player.location.x)} (Required, Number)`, { defaultValue: `${Math.round(player.location.x)}` })
        .textField("Y Coordinate", `${Math.round(player.location.y)} (Required, Number)`, { defaultValue: `${Math.round(player.location.y)}` })
        .textField("Z Coordinate", `${Math.round(player.location.z)} (Required, Number)`, { defaultValue: `${Math.round(player.location.z)}` })
        .textField("Dimension", `${player.dimension.id.replace("minecraft:", "")} (Required, String)`, { defaultValue: `${player.dimension.id.replace("minecraft:", "")}` })
        .show(player).then((res) => {
            if (res.canceled) return player.sendMessage(`§r§8[§dWarps!§8] §cCanceled Warp Add!§r`)

            if (!res.formValues[0] || !res.formValues[1] || !res.formValues[2] || !res.formValues[3] || !res.formValues[4]) return player.sendMessage(`§r§8[§dWarps!§8] §7You need to fill up everything what is required!§r`)
            if (isNaN(res.formValues[1]) || isNaN(res.formValues[2]) || isNaN(res.formValues[3])) return player.sendMessage(`§r§8[§dWarps!§8] §7The Coordinates must be a Number!§r`)
            if (res.formValues[4].toLowerCase() !== "overworld" && res.formValues[4].toLowerCase() !== "nether" && res.formValues[4].toLowerCase() !== "the_end") return player.sendMessage(`§r§8[§dWarps!§8] §7The Dimension must be one of these: "overworld", "nether", "the_end"!§r`)

            res.formValues[0] = res.formValues[0].replace('"', "'")

            player.runCommand(`scoreboard players set "{\\"x\\": ${res.formValues[1]}, \\"y\\": ${res.formValues[2]}, \\"z\\": ${res.formValues[3]}, \\"dimension\\": \\"${res.formValues[4].toLowerCase()}\\", \\"name\\": \\"${res.formValues[0]}\\"}" warps:data 1`)
            player.sendMessage(`§r§8[§dWarps!§8] §7Added Warp "${res.formValues[0]}" at position X: ${res.formValues[1]}, Y: ${res.formValues[2]}, Z: ${res.formValues[3]}!§r`)
        })
}

function removeWarpMenu(player) {
    let actionForm = new MinecraftUi.ActionFormData()
        .title("§r§4Delete §dWarp§r")

    let warps = []
    for (let warpo of Minecraft.world.scoreboard.getObjective("warps:data").getParticipants()) {
        let warp = JSON.parse(warpo.displayName.replaceAll("\\", ""))
        warp.data = warpo.displayName
        if (!warp?.name || !warp?.x.toString() || !warp?.y.toString() || !warp?.z.toString() || !warp?.dimension) continue
        actionForm.button(`§r${warp.name}§r\n§fX: §8${warp.x} §fY: §8${warp.y} §fZ: §8${warp.z}§r ${warp.dimension.replace("overworld", "§r§2Overworld§r").replace("nether", "§r§cNether§r").replace("the_end", "§r§5The End§r")}`)
        warps.push(warp)
    }
    if (warps.length == 0) return player.sendMessage("§r§8[§dWarps!§8] §cThere are no Warps!§r")

    actionForm.show(player).then((res) => {
        if (res.canceled) return player.sendMessage(`§r§8[§dWarps!§8] §cCanceled Warp Delete!§r`)

        warps = warps[res.selection]
        new MinecraftUi.MessageFormData()
            .title(`§r§4Warp Delete§r`)
            .body(`§r§cAre you sure that you want to delete this Warp for ever?§r\n§8Name: §f${warps.name}\n§8X: §f${warps.x}\n§8Y: §f${warps.y}\n§8Z: §f${warps.z}\n§8Dimension: §f${warps.dimension}`)
            .button1("§r§cYes§r")
            .button2("§r§aNo§r")
            .show(player).then((res) => {
                if (res.selection == 1 || res.canceled) return player.sendMessage(`§r§8[§dWarps!§8] §aNot deleted Warp "${warps.name}"!§r`)
                else if (res.selection == 0) {
                    player.runCommand(`scoreboard players reset "${warps.data}" warps:data`)
                    return player.sendMessage(`§r§8[§dWarps!§8] §cDeleted Warp "${warps.name}"!§r`)
                }
            })
    })
}
