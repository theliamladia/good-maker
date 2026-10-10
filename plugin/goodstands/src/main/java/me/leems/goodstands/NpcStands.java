package me.leems.goodstands;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import net.citizensnpcs.api.CitizensAPI;
import net.citizensnpcs.api.npc.NPC;
import net.citizensnpcs.api.trait.trait.Equipment;
import net.citizensnpcs.trait.LookClose;
import net.citizensnpcs.trait.SkinTrait;
import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.Location;
import org.bukkit.entity.EntityType;
import org.bukkit.entity.Player;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

// GOOD® stands in the real skin: a Citizens NPC wearing the signed texture
// behind a code from THE MAKER's MINECRAFT STAND button (good.leems.me/api/stand).
// Only loaded when Citizens is on the server.
final class NpcStands {
    private static final String KEY = "goodstand";
    private static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).build();

    private NpcStands() {}

    static void spawn(GoodStands plugin, Player p, String rawCode) {
        String code = rawCode.trim().toUpperCase(java.util.Locale.ROOT);
        if (!code.matches("[A-Z2-9]{6}")) { p.sendMessage(ChatColor.RED + "Stand codes are 6 letters/numbers, from MINECRAFT STAND in THE MAKER."); return; }
        Location at = GoodStands.inFront(p);
        p.sendMessage(ChatColor.GRAY + "Fetching GOOD® stand " + code + "…");
        HttpRequest req = HttpRequest.newBuilder(URI.create(plugin.site() + "/api/stand?code=" + code))
                .timeout(Duration.ofSeconds(10)).header("User-Agent", "GoodStands/" + plugin.getDescription().getVersion()).GET().build();
        HTTP.sendAsync(req, HttpResponse.BodyHandlers.ofString()).whenComplete((res, err) -> Bukkit.getScheduler().runTask(plugin, () -> {
            if (err != null || res == null) { p.sendMessage(ChatColor.RED + "Couldn't reach " + plugin.site() + "."); return; }
            if (res.statusCode() == 404) { p.sendMessage(ChatColor.RED + "No GOOD® stand with code " + code + "."); return; }
            if (res.statusCode() != 200) { p.sendMessage(ChatColor.RED + "The site said " + res.statusCode() + ". Try again."); return; }
            JsonObject j = JsonParser.parseString(res.body()).getAsJsonObject();
            String name = j.has("name") ? j.get("name").getAsString() : "GOOD®";
            NPC npc = CitizensAPI.getNPCRegistry().createNPC(EntityType.PLAYER, "GOOD" + code);
            npc.data().setPersistent(KEY, code);
            npc.data().setPersistent(NPC.Metadata.NAMEPLATE_VISIBLE, false);
            npc.setProtected(true);
            npc.getOrAddTrait(SkinTrait.class).setSkinPersistent("good-" + code, j.get("signature").getAsString(), j.get("value").getAsString());
            npc.getOrAddTrait(LookClose.class).lookClose(true);
            npc.getOrAddTrait(Equipment.class);
            npc.spawn(at);
            p.sendMessage(ChatColor.BLUE + "GOOD® stand " + code + " is up: " + ChatColor.WHITE + name);
        }));
    }

    // Nearest GOOD® NPC within 5 blocks; true if one was removed.
    static boolean removeNearest(Player p) {
        NPC best = null; double bd = 25;
        for (NPC npc : CitizensAPI.getNPCRegistry()) {
            if (!npc.isSpawned() || !npc.data().has(KEY) || npc.getEntity().getWorld() != p.getWorld()) continue;
            double d = npc.getEntity().getLocation().distanceSquared(p.getLocation());
            if (d < bd) { bd = d; best = npc; }
        }
        if (best == null) return false;
        best.destroy();
        return true;
    }
}
