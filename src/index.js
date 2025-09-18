import { addFilter } from '@wordpress/hooks';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, SelectControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useState, useEffect } from '@wordpress/element';

// Les blocs sur lesquels nous voulons ajouter notre panneau
const ALLOWED_BLOCKS = [
    'core/image',
    'core/button',
    'core/paragraph',
    'core/heading'
];

// Les sources de binding disponibles
const BINDING_SOURCES = [
    { label: 'Pattern Overrides', value: 'core/pattern-overrides' },
    { label: 'Post Meta', value: 'core/post-meta' }, // Exemple d'autre source
];

/**
 * HOC (Higher-Order Component) pour ajouter nos contrôles.
 */
const withBindingControls = createHigherOrderComponent((BlockEdit) => {
    return (props) => {
        // Ne rien faire si ce n'est pas un des blocs autorisés
        if (!ALLOWED_BLOCKS.includes(props.name)) {
            return <BlockEdit {...props} />;
        }

        const { attributes, setAttributes } = props;
        const { metadata } = attributes;

        // États locaux pour nos champs de formulaire
        const [bindingName, setBindingName] = useState('');
        const [bindingSource, setBindingSource] = useState('core/pattern-overrides');

        // Mettre à jour les champs si des métadonnées existent déjà
        useEffect(() => {
            if (metadata?.name) {
                setBindingName(metadata.name);
            }
            if (metadata?.bindings?.__default?.source) {
                setBindingSource(metadata.bindings.__default.source);
            }
        }, [metadata]);


        // Fonction pour appliquer le binding
        const applyBinding = () => {
            const newBinding = {
                bindings: {
                    __default: {
                        source: bindingSource,
                    },
                },
                name: bindingName,
            };
            setAttributes({ metadata: newBinding });
        };

        // Fonction pour supprimer le binding
        const removeBinding = () => {
            // Crée une copie des attributs et supprime la clé metadata
            const newAttributes = { ...attributes };
            delete newAttributes.metadata;
            setAttributes(newAttributes);
            setBindingName(''); // Réinitialise le champ
        };


        return (
            <>
                <BlockEdit {...props} />
                <InspectorControls>
                    <PanelBody title={__('Configuration des Bindings', 'mon-plugin-bindings')}>
                        <p>Liez ce bloc à une source de données dynamique.</p>
                        <SelectControl
                            label={__('Source des données', 'mon-plugin-bindings')}
                            value={bindingSource}
                            options={BINDING_SOURCES}
                            onChange={(source) => setBindingSource(source)}
                        />
                        <TextControl
                            label={__('Nom de la métadonnée (Name)', 'mon-plugin-bindings')}
                            value={bindingName}
                            onChange={(name) => setBindingName(name)}
                            help={__("Ex: 'Image 1', 'Titre de l'article'", 'mon-plugin-bindings')}
                        />
                        <Button
                            isPrimary
                            onClick={applyBinding}
                            disabled={!bindingName}
                        >
                            {__('Appliquer le Binding', 'mon-plugin-bindings')}
                        </Button>
                        {metadata && (
                           <Button
                                isLink
                                isDestructive
                                onClick={removeBinding}
                                style={{ marginTop: '10px' }}
                           >
                               {__('Supprimer le Binding', 'mon-plugin-bindings')}
                           </Button>
                        )}
                    </PanelBody>
                </InspectorControls>
            </>
        );
    };
}, 'withBindingControls');

// Appliquer le filtre sur le composant d'édition de bloc
addFilter(
    'editor.BlockEdit',
    'mon-plugin/with-binding-controls',
    withBindingControls
);