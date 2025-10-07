/* global wp */
import { addFilter } from '@wordpress/hooks';
import { InspectorControls } from '@wordpress/block-editor';
import {
    PanelBody,
    TextControl,
    SelectControl,
    Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useState, useEffect } from '@wordpress/element';

const ALLOWED_BLOCKS = ['core/image', 'core/button', 'core/paragraph', 'core/heading'];

const BINDING_SOURCES = [
    { label: 'Pattern Overrides', value: 'core/pattern-overrides' },
    { label: 'Post Meta',         value: 'core/post-meta' },
    { label: 'Lorem Ipsum',       value: 'up/lorem-ipsum' },
    { label: 'Lorem Picsum',      value: 'up/lorem-picsum' },
];

// Champs affichés pour la configuration "Post Meta".
// Nous normalisons à une seule clé meta: args.key
const META_FIELDS = {
    'core/image': [
        { key: 'key', label: 'Clé meta (key)' },
    ],
    'core/button': [
        { key: 'key', label: 'Clé meta (key)' },
    ],
    'core/paragraph': [
        { key: 'key', label: 'Clé meta (key)' },
    ],
    'core/heading': [
        { key: 'key', label: 'Clé meta (key)' },
    ],
};

const BLOCK_BINDING_ATTRIBUTES = {
    'core/paragraph': 'content',
    'core/heading':   'content',
    'core/button':    'text',
    'core/image':     'url',
};

// Liste des blocs pour lesquels un placeholder natif a du sens (RichText)
const PLACEHOLDER_SUPPORTED = new Set(['core/paragraph', 'core/heading', 'core/button']);

const withBindingControls = createHigherOrderComponent((BlockEdit) => {
    return (props) => {
        if (!ALLOWED_BLOCKS.includes(props.name)) return <BlockEdit {...props} />;

        const { attributes, setAttributes } = props;
        const { metadata } = attributes;

        const [bindingName, setBindingName] = useState('');
        const [bindingSource, setBindingSource] = useState('core/pattern-overrides');
        const [bindingKey, setBindingKey] = useState({});
        const [wordCount, setWordCount] = useState(8);
        const [loremSelect, setLoremSelect] = useState('');

        useEffect(() => {
            if (metadata?.name) setBindingName(metadata.name);

            const attr    = BLOCK_BINDING_ATTRIBUTES[props.name];
            const binding = metadata?.bindings?.[attr] || metadata?.bindings?.__default;

            if (binding?.source) setBindingSource(binding.source);

            if (binding?.source === 'core/post-meta') {
                const a = binding.args || {};
                const normalized = {
                    key: a.key ?? a.content ?? a.url ?? a.text ?? a.title ?? '',
                };
                setBindingKey(normalized);
            }

            if (binding?.source === 'up/lorem-ipsum') {
                setWordCount(parseInt(binding.args?.count, 10) || 8);
            }

            if (binding?.source === 'up/lorem-picsum') {
                setBindingKey({
                    width: binding.args?.width || 1200,
                    height: binding.args?.height || 700,
                    id: binding.args?.id || '',
                });
            }
        }, [metadata, props.name]);

        const applyBinding = () => {
            const attr = BLOCK_BINDING_ATTRIBUTES[props.name] || 'content';

            const newBinding = {
                bindings: { [attr]: { source: bindingSource } },
            };
            if (bindingName) newBinding.name = bindingName;

            const args = {};

            if (bindingSource === 'core/post-meta') {
                // Toujours produire args.key
                if (bindingKey?.key) args.key = bindingKey.key;
            }

            if (bindingSource === 'up/lorem-ipsum') {
                args.count = parseInt(wordCount, 10) || 8;
            }

            if (bindingSource === 'up/lorem-picsum') {
                args.width = bindingKey.width || 1200;
                args.height = bindingKey.height || 700;
                if (bindingKey.id) args.id = bindingKey.id;
            }

            if (Object.keys(args).length) {
                newBinding.bindings[attr].args = args;
            }

            setAttributes({ metadata: newBinding });
        };

        const removeBinding = () => {
            setAttributes({ metadata: {} });
            setBindingName('');
            setBindingSource('core/pattern-overrides');
            setBindingKey({});
            setWordCount(8);
        };

        const isFormValid = () => {
            if (!bindingName) return false;
            if (bindingSource === 'core/post-meta') {
                return !!(bindingKey && typeof bindingKey.key === 'string' && bindingKey.key.trim() !== '');
            }
            return true;
        };

        // Génère un texte lorem ipsum du nombre de mots demandé
        const makeLoremIpsum = (count) => {
            const base = (
                'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'
            ).split(' ');
            const words = [];
            for (let i = 0; i < count; i++) {
                words.push(base[i % base.length]);
            }
            const sentence = words.join(' ');
            return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '…';
        };

        // Génère l'URL de preview pour Lorem Picsum
        const getPicsumUrl = () => {
            if (bindingSource !== 'up/lorem-picsum') return null;
            const width = bindingKey.width || 1200;
            const height = bindingKey.height || 700;
            const id = bindingKey.id ? `/id/${bindingKey.id}` : '';
            return `https://picsum.photos${id}/${width}/${height}`;
        };

        return (
            <>
                <BlockEdit {...props} />
                <InspectorControls>
                    <PanelBody title={__('Configuration des Bindings', 'mon-plugin-bindings')}>
                        {PLACEHOLDER_SUPPORTED.has(props.name) && (
                            <>
                                <TextControl
                                    label={__('Placeholder natif', 'mon-plugin-bindings')}
                                    value={attributes.placeholder || ''}
                                    onChange={(val) => {
                                        const next = typeof val === 'string' ? val : '';
                                        if (next.trim() === '') {
                                            setAttributes({ placeholder: undefined });
                                        } else {
                                            setAttributes({ placeholder: next });
                                        }
                                    }}
                                    help={__('S’affiche dans l’éditeur lorsque le contenu est vide (aucun autre méta ajouté).', 'mon-plugin-bindings')}
                                />

                                <SelectControl
                                    label={__('Générer un Lorem ipsum', 'mon-plugin-bindings')}
                                    value={loremSelect}
                                    options={[
                                        { label: __('— Choisir —', 'mon-plugin-bindings'), value: '' },
                                        { label: '3 mots', value: '3' },
                                        { label: '5 mots', value: '5' },
                                        { label: '8 mots', value: '8' },
                                        { label: '20 mots', value: '20' },
                                        { label: '150 mots', value: '150' },
                                        { label: '300 mots', value: '300' },
                                    ]}
                                    onChange={(val) => {
                                        setLoremSelect(val);
                                        const n = parseInt(val, 10);
                                        if (!isNaN(n) && n > 0) {
                                            const txt = makeLoremIpsum(n);
                                            setAttributes({ placeholder: txt });
                                        }
                                    }}
                                    help={__('Sélectionner un nombre de mots pour remplir le placeholder avec du Lorem ipsum. La sélection n’est pas sauvegardée.', 'mon-plugin-bindings')}
                                />
                            </>
                        )}

                        <p>Liez ce bloc à une source de données dynamique.</p>

                        <SelectControl
                            label={__('Source des données', 'mon-plugin-bindings')}
                            value={bindingSource}
                            options={BINDING_SOURCES}
                            onChange={(src) => {
                                setBindingSource(src);
                                setBindingKey(
                                    src === 'up/lorem-picsum'
                                        ? { width: 1200, height: 700, id: '' }
                                        : {}
                                );
                                setWordCount(8);
                            }}
                        />
  
                        <TextControl
                            label={__('Nom du block', 'mon-plugin-bindings')}
                            value={bindingName}
                            onChange={setBindingName}
                            help={__("Ex: 'Intro', 'Titre de l'article'", 'mon-plugin-bindings')}
                        />
  
                        

                        {bindingSource === 'core/post-meta' &&
                            (META_FIELDS[props.name] || []).map((field) => (
                                <TextControl
                                    label={field.label}
                                    value={bindingKey[field.key] || ''}
                                    onChange={(val) =>
                                        setBindingKey((prev) => ({
                                            ...prev,
                                            [field.key]: val,
                                        }))
                                    }
                                />
                            ))}

                        {bindingSource === 'up/lorem-ipsum' && (
                            <TextControl
                                label={__('Nombre de mots', 'mon-plugin-bindings')}
                                type="number"
                                min="1"
                                value={wordCount}
                                onChange={(val) => {
                                    if (val === '') {
                                        setWordCount(8);
                                    } else {
                                        const num = parseInt(val, 10);
                                        if (!isNaN(num)) {
                                            setWordCount(num);
                                        }
                                    }
                                }}
                            />
                        )}

                        {bindingSource === 'up/lorem-picsum' && (
                            <>
                                <TextControl
                                    label={__('Largeur (px)', 'mon-plugin-bindings')}
                                    type="number"
                                    value={bindingKey.width}
                                    onChange={(val) =>
                                        setBindingKey((prev) => ({
                                            ...prev,
                                            width: val === '' ? 1200 : parseInt(val, 10) || 1200,
                                        }))
                                    }
                                />
                                <TextControl
                                    label={__('Hauteur (px)', 'mon-plugin-bindings')}
                                    type="number"
                                    value={bindingKey.height}
                                    onChange={(val) =>
                                        setBindingKey((prev) => ({
                                            ...prev,
                                            height: val === '' ? 700 : parseInt(val, 10) || 700,
                                        }))
                                    }
                                />
                                <TextControl
                                    label={__('ID (Picsum)', 'mon-plugin-bindings')}
                                    type="number"
                                    value={bindingKey.id}
                                    onChange={(val) =>
                                        setBindingKey((prev) => ({
                                            ...prev,
                                            id: val === '' ? '' : parseInt(val, 10) || '',
                                        }))
                                    }
                                    help={__('Changer l’ID pour obtenir des images différentes.', 'mon-plugin-bindings')}
                                />

                                {getPicsumUrl() && (
                                    <div style={{ marginTop: '15px' }}>
                                        <strong>{__('Prévisualisation :', 'mon-plugin-bindings')}</strong>
                                        <img
                                            src={getPicsumUrl()}
                                            alt="Preview Picsum"
                                            style={{ maxWidth: '100%', borderRadius: '4px', marginTop: '8px' }}
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        <Button isPrimary onClick={applyBinding} disabled={!isFormValid()}>
                            {__('Appliquer le Binding', 'mon-plugin-bindings')}
                        </Button>

                        {metadata && metadata.bindings && (
                            <Button isLink isDestructive onClick={removeBinding} style={{ marginTop: '10px' }}>
                                {__('Supprimer le Binding', 'mon-plugin-bindings')}
                            </Button>
                        )}

                        {metadata && metadata.bindings && (
                            <div
                                style={{
                                    marginTop: '15px',
                                    padding: '10px',
                                    backgroundColor: '#f0f0f0',
                                    borderRadius: '4px',
                                }}
                            >
                                <strong>{__('Binding actuel:', 'mon-plugin-bindings')}</strong>
                                <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                                    {JSON.stringify(metadata, null, 2)}
                                </pre>
                            </div>
                        )}
                    </PanelBody>
                </InspectorControls>
            </>
        );
    };
}, 'withBindingControls');

addFilter('editor.BlockEdit', 'mon-plugin/with-binding-controls', withBindingControls);
