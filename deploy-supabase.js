// Script de déploiement des tables Supabase
// Utilisez ce script pour créer toutes les tables nécessaires

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.log('Assurez-vous d\'avoir configuré :');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deploySchema() {
  try {
    console.log('🚀 Déploiement du schéma Supabase...');
    
    // Lire le fichier schema.sql
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Diviser le schéma en requêtes individuelles
    const queries = schema
      .split(';')
      .map(query => query.trim())
      .filter(query => query.length > 0 && !query.startsWith('--'));
    
    console.log(`📋 ${queries.length} requêtes à exécuter`);
    
    // Exécuter chaque requête
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      try {
        console.log(`⏳ Exécution de la requête ${i + 1}/${queries.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        
        if (error) {
          console.warn(`⚠️  Requête ${i + 1} ignorée (probablement déjà existante):`, error.message);
        } else {
          console.log(`✅ Requête ${i + 1} exécutée avec succès`);
        }
      } catch (err) {
        console.warn(`⚠️  Erreur sur la requête ${i + 1}:`, err.message);
      }
    }
    
    console.log('🎉 Déploiement terminé !');
    
    // Vérifier les tables créées
    await verifyTables();
    
  } catch (error) {
    console.error('❌ Erreur lors du déploiement:', error);
    process.exit(1);
  }
}

async function verifyTables() {
  console.log('\n🔍 Vérification des tables créées...');
  
  const expectedTables = [
    'roles',
    'users',
    'profiles', 
    'prestataires',
    'lieux_receptions',
    'services',
    'mariages',
    'prestataires_mariages',
    'taches_mariage',
    'budgets',
    'invites',
    'carousel_items',
    'avis',
    'favoris',
    'abonnements'
  ];
  
  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ Table ${tableName}: OK`);
      }
    } catch (err) {
      console.log(`❌ Table ${tableName}: ${err.message}`);
    }
  }
}

async function insertSampleData() {
  console.log('\n📝 Insertion de données d\'exemple...');
  
  try {
    // Insérer des éléments de carrousel d'exemple
    const carouselItems = [
      {
        titre: 'Bienvenue sur Arooskena',
        description: 'Votre plateforme de mariage à Djibouti',
        image_url: '/carousel/1.jpg',
        ordre: 1,
        is_active: true,
        type: 'info'
      },
      {
        titre: 'Trouvez vos prestataires',
        description: 'Des professionnels qualifiés pour votre mariage',
        image_url: '/carousel/2.jpg',
        ordre: 2,
        is_active: true,
        type: 'promotion'
      },
      {
        titre: 'Planifiez votre mariage',
        description: 'Outils de planification et de gestion',
        image_url: '/carousel/3.jpg',
        ordre: 3,
        is_active: true,
        type: 'promotion'
      },
      {
        titre: 'Lieux de réception',
        description: 'Les plus beaux lieux de Djibouti',
        image_url: '/carousel/4.jpg',
        ordre: 4,
        is_active: true,
        type: 'sponsorise'
      }
    ];
    
    for (const item of carouselItems) {
      const { error } = await supabase
        .from('carousel_items')
        .insert(item);
      
      if (error) {
        console.warn(`⚠️  Élément carrousel ignoré:`, error.message);
      } else {
        console.log(`✅ Élément carrousel ajouté: ${item.titre}`);
      }
    }
    
    console.log('✅ Données d\'exemple insérées');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données:', error);
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node deploy-supabase.js [options]

Options:
  --schema     Déployer le schéma de base de données
  --sample     Insérer des données d'exemple
  --all        Déployer le schéma et insérer les données d'exemple
  --verify     Vérifier les tables créées
  --help, -h   Afficher cette aide

Exemples:
  node deploy-supabase.js --all
  node deploy-supabase.js --schema
  node deploy-supabase.js --sample
    `);
    return;
  }
  
  if (args.includes('--all') || args.length === 0) {
    await deploySchema();
    await insertSampleData();
  } else if (args.includes('--schema')) {
    await deploySchema();
  } else if (args.includes('--sample')) {
    await insertSampleData();
  } else if (args.includes('--verify')) {
    await verifyTables();
  } else {
    console.log('❌ Option invalide. Utilisez --help pour voir les options disponibles.');
  }
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { deploySchema, insertSampleData, verifyTables };
