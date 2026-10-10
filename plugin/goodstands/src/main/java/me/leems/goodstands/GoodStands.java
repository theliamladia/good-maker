package me.leems.goodstands;

import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.Color;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.OfflinePlayer;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.configuration.file.YamlConfiguration;
import org.bukkit.entity.ArmorStand;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Player;
import org.bukkit.inventory.EquipmentSlot;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ArmorMeta;
import org.bukkit.inventory.meta.LeatherArmorMeta;
import org.bukkit.inventory.meta.SkullMeta;
import org.bukkit.inventory.meta.trim.ArmorTrim;
import org.bukkit.inventory.meta.trim.TrimMaterial;
import org.bukkit.inventory.meta.trim.TrimPattern;
import org.bukkit.persistence.PersistentDataType;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.util.EulerAngle;

import java.io.InputStreamReader;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

/**
 * GoodStands: armor stands dressed in GOOD® DESIGN outfits.
 *
 * Minecraft can't put a custom skin texture on an armor stand, so each piece is shown the way
 * vanilla allows: the player's own head, a leather chestplate dyed the top's main colour with an
 * armor trim in its accent colour, leggings dyed the bottom's colour and boots dyed the shoe's.
 * The stand's name tag says what it's wearing. Outfits come from outfits.yml, generated from
 * the catalogue on good.leems.me.
 */
public final class GoodStands extends JavaPlugin implements TabCompleter {
    private final Map<String, Piece> tops = new LinkedHashMap<>(), bottoms = new LinkedHashMap<>(), shoes = new LinkedHashMap<>();
    private NamespacedKey tag;

    record Piece(String id, String name, String color, List<Color> swatch, List<String> shoes) {
        String label() { return color.isEmpty() ? name : name + " " + color; }
    }

    @Override public void onEnable() {
        tag = new NamespacedKey(this, "goodstand");
        load();
        Objects.requireNonNull(getCommand("goodstand")).setTabCompleter(this);
        getLogger().info("Loaded " + tops.size() + " tops, " + bottoms.size() + " bottoms, " + shoes.size() + " shoes.");
    }

    private void load() {
        tops.clear(); bottoms.clear(); shoes.clear();
        if (!new java.io.File(getDataFolder(), "outfits.yml").exists()) saveResource("outfits.yml", false);
        YamlConfiguration y = YamlConfiguration.loadConfiguration(new java.io.File(getDataFolder(), "outfits.yml"));
        if (y.getKeys(false).isEmpty()) y = YamlConfiguration.loadConfiguration(new InputStreamReader(Objects.requireNonNull(getResource("outfits.yml")), StandardCharsets.UTF_8));
        read(y.getConfigurationSection("tops"), tops);
        read(y.getConfigurationSection("bottoms"), bottoms);
        read(y.getConfigurationSection("shoes"), shoes);
    }

    private static void read(ConfigurationSection s, Map<String, Piece> into) {
        if (s == null) return;
        for (String id : s.getKeys(false)) {
            ConfigurationSection p = s.getConfigurationSection(id);
            if (p == null) continue;
            List<Color> sw = new ArrayList<>();
            for (String h : p.getStringList("swatch")) { Color c = hex(h); if (c != null) sw.add(c); }
            into.put(id, new Piece(id, p.getString("name", id), p.getString("color", ""), sw, p.getStringList("shoes")));
        }
    }

    private static Color hex(String h) {
        try { return Color.fromRGB(Integer.parseInt(h.replace("#", ""), 16)); } catch (Exception e) { return null; }
    }

    // ---------- Commands ----------
    @Override public boolean onCommand(CommandSender sender, Command cmd, String label, String[] a) {
        if (a.length == 0) { help(sender, label); return true; }
        switch (a[0].toLowerCase(Locale.ROOT)) {
            case "spawn" -> {
                if (!(sender instanceof Player p)) { sender.sendMessage("Players only."); return true; }
                if (a.length < 2) { sender.sendMessage(ChatColor.RED + "/" + label + " spawn <top|none> [bottom|none] [shoe] [skin player]"); return true; }
                Piece top = pick(tops, a[1]), bottom = a.length > 2 ? pick(bottoms, a[2]) : null;
                Piece shoe = a.length > 3 ? pick(shoes, a[3]) : null;
                String skin = a.length > 4 ? a[4] : p.getName();
                if (top == null && !a[1].equalsIgnoreCase("none")) { sender.sendMessage(ChatColor.RED + "Unknown top: " + a[1]); return true; }
                if (a.length > 2 && bottom == null && !a[2].equalsIgnoreCase("none")) { sender.sendMessage(ChatColor.RED + "Unknown bottom: " + a[2]); return true; }
                spawn(p, top, bottom, shoe, skin);
            }
            case "look" -> {
                // Paste a link from THE MAKER: good.leems.me/?top=...&bottom=...&shoe=...
                if (!(sender instanceof Player p)) { sender.sendMessage("Players only."); return true; }
                if (a.length < 2) { sender.sendMessage(ChatColor.RED + "/" + label + " look <link from THE MAKER> [skin player]"); return true; }
                Map<String, String> q = query(a[1]);
                Piece top = pick(tops, q.getOrDefault("top", "")), bottom = pick(bottoms, q.getOrDefault("bottom", ""));
                Piece shoe = "bare".equals(q.get("feet")) ? null : pick(shoes, q.getOrDefault("shoe", bottom != null && !bottom.shoes().isEmpty() ? bottom.shoes().get(0) : ""));
                if (top == null && bottom == null) { sender.sendMessage(ChatColor.RED + "That link has no top or bottom on it."); return true; }
                String skin = a.length > 2 ? a[2] : q.getOrDefault("u", p.getName());
                spawn(p, top, bottom, shoe, skin);
            }
            case "list" -> {
                String what = a.length > 1 ? a[1].toLowerCase(Locale.ROOT) : "tops";
                Map<String, Piece> m = what.startsWith("b") ? bottoms : what.startsWith("s") ? shoes : tops;
                sender.sendMessage(ChatColor.BLUE + "" + ChatColor.BOLD + "GOOD® " + what.toUpperCase(Locale.ROOT) + ChatColor.GRAY + " (" + m.size() + ")");
                for (Piece pc : m.values()) sender.sendMessage(ChatColor.WHITE + pc.id() + ChatColor.GRAY + "  " + pc.label());
            }
            case "remove" -> {
                if (!(sender instanceof Player p)) { sender.sendMessage("Players only."); return true; }
                Entity best = null; double bd = 25;
                for (Entity e : p.getNearbyEntities(5, 5, 5)) {
                    if (!(e instanceof ArmorStand) || !e.getPersistentDataContainer().has(tag, PersistentDataType.BYTE)) continue;
                    double d = e.getLocation().distanceSquared(p.getLocation());
                    if (d < bd) { bd = d; best = e; }
                }
                if (best == null) sender.sendMessage(ChatColor.RED + "No GOOD® stand within 5 blocks.");
                else { best.remove(); sender.sendMessage(ChatColor.BLUE + "Removed the nearest GOOD® stand."); }
            }
            case "reload" -> { load(); sender.sendMessage(ChatColor.BLUE + "GoodStands reloaded: " + tops.size() + " tops, " + bottoms.size() + " bottoms."); }
            default -> help(sender, label);
        }
        return true;
    }

    private void help(CommandSender s, String l) {
        s.sendMessage(ChatColor.BLUE + "" + ChatColor.BOLD + "GOOD® STANDS");
        s.sendMessage(ChatColor.WHITE + "/" + l + " spawn <top|none> [bottom|none] [shoe] [skin]" + ChatColor.GRAY + " – dress a stand");
        s.sendMessage(ChatColor.WHITE + "/" + l + " look <link from THE MAKER> [skin]" + ChatColor.GRAY + " – a stand from a good.leems.me link");
        s.sendMessage(ChatColor.WHITE + "/" + l + " list [tops|bottoms|shoes]" + ChatColor.GRAY + " – what's available");
        s.sendMessage(ChatColor.WHITE + "/" + l + " remove" + ChatColor.GRAY + " – remove the nearest GOOD® stand");
        s.sendMessage(ChatColor.WHITE + "/" + l + " reload" + ChatColor.GRAY + " – reload outfits.yml");
    }

    private static Piece pick(Map<String, Piece> m, String id) {
        if (id == null || id.isEmpty()) return null;
        Piece p = m.get(id.toLowerCase(Locale.ROOT));
        if (p != null) return p;
        for (Piece c : m.values()) if (c.id().startsWith(id.toLowerCase(Locale.ROOT))) return c;   // kind id, e.g. "shirt-og"
        return null;
    }

    private static Map<String, String> query(String link) {
        Map<String, String> q = new HashMap<>();
        int i = link.indexOf('?');
        String s = i >= 0 ? link.substring(i + 1) : link;
        for (String kv : s.split("&")) {
            int e = kv.indexOf('=');
            if (e > 0) q.put(URLDecoder.decode(kv.substring(0, e), StandardCharsets.UTF_8), URLDecoder.decode(kv.substring(e + 1), StandardCharsets.UTF_8));
        }
        return q;
    }

    // ---------- The stand ----------
    private void spawn(Player p, Piece top, Piece bottom, Piece shoe, String skin) {
        Location at = p.getLocation().add(p.getLocation().getDirection().setY(0).normalize().multiply(2));
        at.setYaw(p.getLocation().getYaw() + 180); at.setPitch(0);
        ArmorStand s = p.getWorld().spawn(at, ArmorStand.class, st -> {
            st.setArms(true); st.setBasePlate(false); st.setGravity(false); st.setPersistent(true);
            st.setLeftArmPose(new EulerAngle(Math.toRadians(-8), 0, Math.toRadians(-6)));
            st.setRightArmPose(new EulerAngle(Math.toRadians(-8), 0, Math.toRadians(6)));
            st.getPersistentDataContainer().set(tag, PersistentDataType.BYTE, (byte) 1);
            for (EquipmentSlot slot : new EquipmentSlot[]{EquipmentSlot.HEAD, EquipmentSlot.CHEST, EquipmentSlot.LEGS, EquipmentSlot.FEET, EquipmentSlot.HAND, EquipmentSlot.OFF_HAND}) {
                st.addEquipmentLock(slot, ArmorStand.LockType.REMOVING_OR_CHANGING);
                st.addEquipmentLock(slot, ArmorStand.LockType.ADDING_OR_CHANGING);
            }
        });
        var eq = Objects.requireNonNull(s.getEquipment());
        eq.setHelmet(head(skin));
        if (top != null) eq.setChestplate(armor(Material.LEATHER_CHESTPLATE, top, TrimPattern.COAST));
        if (bottom != null) eq.setLeggings(armor(Material.LEATHER_LEGGINGS, bottom, TrimPattern.SILENCE));
        if (shoe != null) eq.setBoots(armor(Material.LEATHER_BOOTS, shoe, null));
        String name = ChatColor.BLUE + "" + ChatColor.BOLD + "GOOD® " + ChatColor.WHITE
            + (top != null ? top.label() : "") + (top != null && bottom != null ? ChatColor.GRAY + " + " + ChatColor.WHITE : "") + (bottom != null ? bottom.label() : "");
        s.setCustomName(name);
        s.setCustomNameVisible(true);
        p.sendMessage(ChatColor.BLUE + "Spawned a GOOD® stand: " + ChatColor.WHITE + ChatColor.stripColor(name).replace("GOOD® ", ""));
    }

    private static ItemStack head(String player) {
        ItemStack it = new ItemStack(Material.PLAYER_HEAD);
        SkullMeta m = (SkullMeta) it.getItemMeta();
        if (m != null && player != null && !player.isEmpty()) {
            @SuppressWarnings("deprecation") OfflinePlayer op = Bukkit.getOfflinePlayer(player);   // fetches the skin by name
            m.setOwningPlayer(op);
            it.setItemMeta(m);
        }
        return it;
    }

    // Leather dyed the piece's main colour; an armor trim in its accent colour when it has one.
    private static ItemStack armor(Material mat, Piece pc, TrimPattern pattern) {
        ItemStack it = new ItemStack(mat);
        if (!(it.getItemMeta() instanceof LeatherArmorMeta m)) return it;
        m.setColor(pc.swatch().isEmpty() ? Color.fromRGB(0x888888) : pc.swatch().get(0));
        m.setDisplayName(ChatColor.WHITE + pc.label());
        m.setLore(List.of(ChatColor.BLUE + "GOOD® DESIGN", ChatColor.GRAY + "good.leems.me"));
        if (pattern != null && pc.swatch().size() > 1 && m instanceof ArmorMeta am) am.setTrim(new ArmorTrim(nearestTrim(pc.swatch().get(1)), pattern));
        it.setItemMeta(m);
        return it;
    }

    private static final Map<TrimMaterial, Integer> TRIM_RGB = new LinkedHashMap<>();
    static {
        TRIM_RGB.put(TrimMaterial.QUARTZ, 0xE3D4C4); TRIM_RGB.put(TrimMaterial.IRON, 0xCFD5D6); TRIM_RGB.put(TrimMaterial.NETHERITE, 0x3C3131);
        TRIM_RGB.put(TrimMaterial.REDSTONE, 0x971607); TRIM_RGB.put(TrimMaterial.COPPER, 0xB4684D); TRIM_RGB.put(TrimMaterial.GOLD, 0xDEB12D);
        TRIM_RGB.put(TrimMaterial.EMERALD, 0x11A036); TRIM_RGB.put(TrimMaterial.DIAMOND, 0x6EECD2); TRIM_RGB.put(TrimMaterial.LAPIS, 0x21497B);
        TRIM_RGB.put(TrimMaterial.AMETHYST, 0x9A5CC6);
    }
    private static TrimMaterial nearestTrim(Color c) {
        TrimMaterial best = TrimMaterial.IRON; double bd = Double.MAX_VALUE;
        for (var e : TRIM_RGB.entrySet()) {
            int v = e.getValue(); double d = Math.pow(c.getRed() - (v >> 16 & 255), 2) + Math.pow(c.getGreen() - (v >> 8 & 255), 2) + Math.pow(c.getBlue() - (v & 255), 2);
            if (d < bd) { bd = d; best = e.getKey(); }
        }
        return best;
    }

    // ---------- Tab completion ----------
    @Override public List<String> onTabComplete(CommandSender s, Command c, String l, String[] a) {
        List<String> opts;
        if (a.length == 1) opts = List.of("spawn", "look", "list", "remove", "reload");
        else if (a[0].equalsIgnoreCase("list") && a.length == 2) opts = List.of("tops", "bottoms", "shoes");
        else if (a[0].equalsIgnoreCase("spawn") && a.length == 2) opts = with("none", tops.keySet());
        else if (a[0].equalsIgnoreCase("spawn") && a.length == 3) opts = with("none", bottoms.keySet());
        else if (a[0].equalsIgnoreCase("spawn") && a.length == 4) { Piece b = pick(bottoms, a[2]); opts = b != null && !b.shoes().isEmpty() ? b.shoes() : new ArrayList<>(shoes.keySet()); }
        else if ((a[0].equalsIgnoreCase("spawn") && a.length == 5) || (a[0].equalsIgnoreCase("look") && a.length == 3)) opts = Bukkit.getOnlinePlayers().stream().map(Player::getName).collect(Collectors.toList());
        else opts = List.of();
        String cur = a[a.length - 1].toLowerCase(Locale.ROOT);
        return opts.stream().filter(o -> o.toLowerCase(Locale.ROOT).startsWith(cur)).limit(80).collect(Collectors.toList());
    }
    private static List<String> with(String first, Collection<String> rest) { List<String> l = new ArrayList<>(); l.add(first); l.addAll(rest); return l; }
}
