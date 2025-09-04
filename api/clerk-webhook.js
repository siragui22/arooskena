import { Webhook } from "svix";
import { createClient } from "@supabase/supabase-js";

// ✅ connexion à Supabase (clé service_role uniquement côté serveur)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false, // requis pour la vérification Clerk/Svix
  },
};

export default async function handler(req, res) {
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

  let evt;
  try {
    const payload = await buffer(req);
    evt = wh.verify(payload.toString(), req.headers);
  } catch (err) {
    console.error("❌ Erreur Clerk webhook:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ cas : nouvel utilisateur créé dans Clerk
  if (evt.type === "user.created") {
    const user = evt.data;

    // récupérer rôle "guest"
    const roleId = await getRoleId("guest");

    // insérer user dans Supabase
    const { error } = await supabase.from("users").insert([
      {
        clerk_id: user.id,
        email: user.email_addresses[0]?.email_address,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone_numbers[0]?.phone_number || null,
        avatar: user.image_url,
        slug: `${(user.first_name || "").toLowerCase()}-${(user.last_name || "").toLowerCase()}`,
        role_id: roleId,
        is_active: true,
      },
    ]);

    if (error) {
      console.error("❌ Erreur insertion user dans Supabase:", error);
    } else {
      console.log(`✅ Utilisateur ${user.id} ajouté avec rôle guest`);
    }
  }

  res.status(200).json({ received: true });
}

// 🔹 Helper → récupérer l’ID du rôle par son "name"
async function getRoleId(roleName) {
  const { data, error } = await supabase
    .from("roles")
    .select("id")
    .eq("name", roleName)
    .single();

  if (error) {
    console.error("Erreur récupération rôle :", error);
    return null;
  }
  return data?.id || null;
}

// 🔹 Transforme req en buffer (obligatoire pour svix)
function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
