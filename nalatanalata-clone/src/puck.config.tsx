import type { Config } from "@measured/puck";
import Hero from "./components/Hero";
import FeatureSection from "./components/FeatureSection";
import ProductGrid from "./components/ProductGrid";
import JournalSection from "./components/JournalSection";
import AboutSection from "./components/AboutSection";

type Props = {
    Hero: { title: string; subtitle: string; buttonText: string };
    FeatureSection: { title: string; description: string };
    ProductGrid: {};
    JournalSection: {};
    AboutSection: {};
};

export const config: Config<Props> = {
    components: {
        Hero: {
            fields: {
                title: { type: "text" },
                subtitle: { type: "textarea" },
                buttonText: { type: "text" },
            },
            render: ({ title, subtitle, buttonText }) => (
                <Hero
                    // We need to update Hero to accept props or wrap it. 
                    // For now, let's assume we'll update Hero to take these props 
                    // or we can pass them via a context if we want to keep using DesignContext.
                    // But Puck works best with direct props.
                    // Let's pass them as overrides if possible, or just render the component.
                    // Actually, Hero currently uses DesignContext. 
                    // To make it work with Puck, we should probably make Hero accept props optionally,
                    // or create a wrapper.
                    // Let's pass the props. We will update Hero to use these props if provided, else context.
                    title={title}
                    subtitle={subtitle}
                    buttonText={buttonText}
                />
            ),
            defaultProps: {
                title: "수공예 조리도구",
                subtitle: "매일 사용해도 오래 사용할 수 있도록 디자인되어 평생 사용할 수 있습니다.",
                buttonText: "컬렉션 쇼핑하기",
            },
        },
        FeatureSection: {
            fields: {
                title: { type: "text" },
                description: { type: "textarea" },
            },
            render: ({ title, description }) => (
                <FeatureSection title={title} description={description} />
            ),
            defaultProps: {
                title: "Holiday Season",
                description: "A selection of thoughtful pieces for giving and gathering...",
            },
        },
        ProductGrid: {
            fields: {},
            render: () => <ProductGrid products={[]} />,
        },
        JournalSection: {
            fields: {},
            render: () => <JournalSection entries={[]} />,
        },
        AboutSection: {
            fields: {},
            render: () => <AboutSection />,
        },
    },
};

export default config;
