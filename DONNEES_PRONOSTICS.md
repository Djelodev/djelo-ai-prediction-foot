# 📊 Données Utilisées pour les Pronostics

## Vue d'ensemble

L'application utilise une combinaison de **statistiques calculées** depuis les matchs passés et d'**analyse IA** (Groq) pour générer les pronostics.

---

## 📈 Données Statistiques des Équipes

### 1. Statistiques de Base (calculées depuis les 20 derniers matchs finis)

Pour chaque équipe (domicile et extérieur), l'application calcule :

- **Victoires (Wins)** : Nombre de victoires
- **Nuls (Draws)** : Nombre de matchs nuls
- **Défaites (Losses)** : Nombre de défaites
- **Buts marqués (Goals For)** : Total de buts marqués
- **Buts encaissés (Goals Against)** : Total de buts encaissés

### 2. Statistiques Dérivées (calculées automatiquement)

À partir des stats de base, l'application calcule :

- **Moyenne buts marqués/match** = `Buts marqués / Nombre de matchs`
- **Moyenne buts encaissés/match** = `Buts encaissés / Nombre de matchs`
- **Différence de buts** = `Buts marqués - Buts encaissés`
- **Buts attendus domicile** = `(Moyenne buts marqués domicile + Moyenne buts encaissés extérieur) / 2`
- **Buts attendus extérieur** = `(Moyenne buts marqués extérieur + Moyenne buts encaissés domicile) / 2`

### 3. Probabilités Statistiques de Base

- **Probabilité victoire domicile** : Basée sur la différence de buts attendus
- **Probabilité match nul** : Calculée pour équilibrer les probabilités
- **Probabilité victoire extérieur** : Basée sur la différence de buts attendus
- **Probabilité BTTS (Both Teams To Score)** : Basée sur les moyennes de buts marqués
- **Probabilité Over/Under 2.5** : Basée sur le total de buts attendus

---

## 🎯 Informations du Match

- **Ligue/Compétition** : Nom de la ligue (ex: "Serie A", "Premier League")
- **Date du match** : Date prévue
- **Heure du match** : Heure prévue
- **Équipe à domicile** : Nom et statistiques
- **Équipe à l'extérieur** : Nom et statistiques

---

## 🤖 Analyse IA (Groq Mixtral-8x7b)

L'IA reçoit toutes les données ci-dessus dans un prompt structuré et analyse :

### Facteurs pris en compte par l'IA :

1. **Statistiques des équipes**
   - Forme récente (actuellement "N/A" - à améliorer)
   - Bilan saison (V-N-D)
   - Buts marqués et encaissés
   - Différence de buts
   - Moyennes par match

2. **Contexte du match**
   - Avantage du terrain (domicile)
   - Importance de la ligue
   - Contexte de la compétition

3. **Analyse comparative**
   - Forces/faiblesses de chaque équipe
   - Comparaison directe des statistiques
   - Probabilités statistiques de base

### Sorties de l'IA :

L'IA génère :
- **Prédiction 1N2** : Victoire domicile (1), Nul (X), ou Victoire extérieur (2) avec un niveau de confiance
- **Score exact prédit** : Ex: "2-1" avec niveau de confiance
- **BTTS** : Les deux équipes marquent (OUI/NON) avec confiance
- **Over/Under 2.5** : Plus ou moins de 2.5 buts avec confiance
- **Analyse détaillée** : Explication en français (2-3 phrases) du raisonnement

---

## 📝 Source des Données

### Matchs Utilisés pour les Statistiques

- **Période** : 30 derniers jours (configurable)
- **Statut** : Uniquement les matchs **FINISHED** (terminés)
- **Nombre** : Maximum 20 derniers matchs par équipe
- **Filtre** : Par ligue (si disponible)

### Synchronisation

Les données sont synchronisées depuis **Football-Data.org** :
- Matchs passés → Calcul des statistiques
- Matchs à venir → Génération des prédictions

---

## ⚠️ Limitations Actuelles

1. **Forme récente** : Actuellement retourne "N/A" (non implémentée)
   - *À améliorer* : Calculer la forme depuis les 5 derniers matchs

2. **Données manquantes** :
   - Blessures/suspensions
   - Confrontations directes (head-to-head)
   - Statistiques à domicile vs extérieur séparées
   - Statistiques des joueurs clés

3. **Période de calcul** :
   - Actuellement : 20 derniers matchs finis
   - Pas de distinction entre saison actuelle et saisons précédentes

---

## 🔄 Améliorations Possibles

1. **Calculer la forme récente** depuis les 5 derniers matchs
2. **Séparer les stats domicile/extérieur** pour chaque équipe
3. **Ajouter les confrontations directes** (historique entre les deux équipes)
4. **Intégrer des données supplémentaires** :
   - Blessures/suspensions
   - Statistiques des joueurs clés
   - Tendances récentes (formes)
5. **Pondération temporelle** : Donner plus de poids aux matchs récents

---

## 📊 Exemple de Données Utilisées

Pour un match **Como 1907 vs US Sassuolo Calcio** :

```
ÉQUIPE DOMICILE - Como 1907:
- Forme récente: N/A
- Statistiques: 2V-2N-0D
- Buts marqués: 8
- Buts encaissés: 2
- Différence: +6
- Moyenne buts marqués/match: 2.00
- Moyenne buts encaissés/match: 0.50

ÉQUIPE EXTERIEURE - US Sassuolo Calcio:
- Forme récente: N/A
- Statistiques: 2V-1N-1D
- Buts marqués: 8
- Buts encaissés: 5
- Différence: +3
- Moyenne buts marqués/match: 2.00
- Moyenne buts encaissés/match: 1.25

CALCULS:
- Buts attendus domicile: (2.00 + 1.25) / 2 = 1.625
- Buts attendus extérieur: (2.00 + 0.50) / 2 = 1.25
- Probabilité BTTS: ~65%
- Probabilité Over 2.5: ~60%
```

Ces données sont ensuite envoyées à l'IA pour générer les prédictions finales.

