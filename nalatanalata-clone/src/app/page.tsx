import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import JournalSection from "@/components/JournalSection";
import AboutSection from "@/components/AboutSection";
import FeatureSection from "@/components/FeatureSection";
import styles from "./page.module.css";

const PRODUCTS = [
  { id: '1', name: 'Chopsticks - Bamboo', price: '$24.00', image: '/images/product-chopsticks.png', slug: 'chopsticks-bamboo' },
  { id: '2', name: 'Hands & Hand Vase', price: '$120.00', image: '/images/product-vase.png', slug: 'hands-hand-vase' },
  { id: '3', name: 'White Oak Standing Shoehorn', price: '$85.00', image: '/images/product-shoehorn.png', slug: 'white-oak-shoehorn' },
  { id: '4', name: 'Cherry Bark Photo Frame', price: '$65.00', image: '/images/product-stool.png', slug: 'cherry-bark-frame' },
  { id: '5', name: 'Cherry Bark Candy Box', price: '$55.00', image: '/images/product-chopsticks.png', slug: 'cherry-bark-candy-box' },
  { id: '6', name: 'Down Feather Hand Warmers', price: '$45.00', image: '/images/product-vase.png', slug: 'down-feather-warmers' },
  { id: '7', name: 'Murai Stool', price: '$350.00', image: '/images/product-stool.png', slug: 'murai-stool' },
  { id: '8', name: 'Still Incense Holder - Cone', price: '$38.00', image: '/images/product-shoehorn.png', slug: 'still-incense-holder' },
  { id: '9', name: 'Matcha No.1-31 - Fukuoka', price: '$42.00', image: '/images/product-vase.png', slug: 'matcha-fukuoka' },
  { id: '10', name: "Life 'Men-Choko' Glass", price: '$60.00', image: '/images/product-chopsticks.png', slug: 'life-men-choko-glass' },
  { id: '11', name: 'Spoke Chair', price: '$850.00', image: '/images/product-stool.png', slug: 'spoke-chair' },
  { id: '12', name: 'Pod Cup - Black', price: '$48.00', image: '/images/product-shoehorn.png', slug: 'pod-cup-black' },
  { id: '13', name: 'Sukiyaki Gyoza Iron Pot', price: '$180.00', image: '/images/product-vase.png', slug: 'sukiyaki-gyoza-pot' },
  { id: '14', name: 'Tsuga Wood First Aid Box', price: '$120.00', image: '/images/product-stool.png', slug: 'tsuga-wood-box' },
  { id: '15', name: 'Linen Floor Mat', price: '$95.00', image: '/images/product-chopsticks.png', slug: 'linen-floor-mat' },
  { id: '16', name: 'Saito Wood Tray', price: '$75.00', image: '/images/product-shoehorn.png', slug: 'saito-wood-tray' },
];

const JOURNAL_ENTRIES = [
  {
    id: '1',
    title: 'At Home with Ryuji Mitani – Containers for Daily Life',
    excerpt: 'Exploring the daily rituals and craftsmanship of Ryuji Mitani.',
    slug: 'at-home-with-ryuji-mitani',
    image: '/images/product-vase.png' // Placeholder
  },
  {
    id: '2',
    title: 'Contained Vessels – Crafting Daily Rituals',
    excerpt: 'Exhibition opening remarks and insights into the collection.',
    slug: 'contained-vessels',
    image: '/images/product-chopsticks.png' // Placeholder
  },
  {
    id: '3',
    title: 'Ten Years',
    excerpt: 'Reflecting on a decade of mindful design and storytelling.',
    slug: 'ten-years',
    image: '/images/product-shoehorn.png' // Placeholder
  },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Hero />
        <ProductGrid products={PRODUCTS} />
        <FeatureSection />
        <JournalSection entries={JOURNAL_ENTRIES} />
        <AboutSection />
      </main>
    </div>
  );
}
