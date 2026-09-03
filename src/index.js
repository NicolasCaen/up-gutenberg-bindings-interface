/* global wp, upGutenbergBindingsInterface */
import { addFilter } from '@wordpress/hooks';
import { InspectorControls } from '@wordpress/block-editor';
import {
    PanelBody,
    TextControl,
    SelectControl,
    Button,
    ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

const ALLOWED_BLOCKS = ['core/image', 'core/button', 'core/paragraph', 'core/heading', 'core/cover', 'core/group', 'core/columns', 'core/column'];

// Sources de bindings chargées depuis l'API REST (reflète le PHP via le filtre
// `up_gutenberg_bindings_interface_sources`). Valeur par défaut vide jusqu'à
// la résolution de la requête.
const DEFAULT_BINDING_SOURCES = [
    { label: __('Pattern Overrides', 'up-gutenberg-bindings-interface'), value: 'core/pattern-overrides' },
];

const BLOCK_BINDING_ATTRIBUTES = {
    'core/paragraph': 'content',
    'core/heading':   'content',
    'core/button':    'text',
    'core/image':     'url',
};

// Liste des blocs pour lesquels un placeholder natif a du sens (RichText)
const PLACEHOLDER_SUPPORTED = new Set(['core/paragraph', 'core/heading', 'core/button']);

// Liste des blocs supportant le contentLock
const CONTENT_LOCK_SUPPORTED = new Set(['core/cover', 'core/group', 'core/columns', 'core/column']);

// Promise partagée au niveau du module : un seul fetch /sources est émis
// quel que soit le nombre de blocs rendus dans l'éditeur. Évite de saturer
// PHP-FPM avec N requêtes concurrentes identiques.
let bindingSourcesPromise = null;

const fetchBindingSources = async (setSources) => {
    try {
        if (!bindingSourcesPromise) {
            bindingSourcesPromise = apiFetch({
                path: '/up-gutenberg-bindings-interface/v1/sources',
            }).finally(() => {
                // Libère la référence une fois résolue/rejetée pour permettre
                // une nouvelle tentative ultérieure si besoin.
                bindingSourcesPromise = null;
            });
        }

        const sources = await bindingSourcesPromise;

        if (Array.isArray(sources) && sources.length > 0) {
            setSources(sources);
        }
    } catch (err) {
        // En cas d'échec, on conserve les sources par défaut.
        // eslint-disable-next-line no-console
        console.error('[up-gutenberg-bindings-interface] Impossible de charger les sources:', err);
    }
};

const withBindingControls = createHigherOrderComponent((BlockEdit) => {
    return (props) => {
        if (!ALLOWED_BLOCKS.includes(props.name)) return <BlockEdit {...props} />;

        const { attributes, setAttributes } = props;
        const { metadata } = attributes;

        // Sources dynamiques chargées depuis le PHP via REST.
        const [bindingSources, setBindingSources] = useState(DEFAULT_BINDING_SOURCES);
        useEffect(() => {
            fetchBindingSources(setBindingSources);
        }, []);

        const [bindingName, setBindingName] = useState('');
        const [bindingSource, setBindingSource] = useState('core/pattern-overrides');
        const [bindingArgs, setBindingArgs] = useState({});
        const [loremSelect, setLoremSelect] = useState('');
        const [contentLockEnabled, setContentLockEnabled] = useState(false);

        // Source actuellement sélectionnée (avec son schéma d'args éventuel).
        const currentSource = bindingSources.find((s) => s.value === bindingSource) || null;
        const currentSourceArgs = currentSource?.args || null;

        useEffect(() => {
            if (metadata?.name) setBindingName(metadata.name);

            const attr    = BLOCK_BINDING_ATTRIBUTES[props.name];
            const binding = metadata?.bindings?.[attr] || metadata?.bindings?.__default;

            if (binding?.source) setBindingSource(binding.source);

            // Restauration des args depuis le binding existant.
            if (binding?.args) {
                setBindingArgs({ ...binding.args });
            } else {
                setBindingArgs({});
            }

            // Charger l'état du templateLock
            if (attributes.templateLock === 'contentOnly') {
                setContentLockEnabled(true);
            } else {
                setContentLockEnabled(false);
            }
        }, [metadata, props.name, attributes.templateLock]);

        const applyBinding = () => {
            const attr = BLOCK_BINDING_ATTRIBUTES[props.name] || 'content';

            const newBinding = {
                bindings: { [attr]: { source: bindingSource } },
            };
            if (bindingName) newBinding.name = bindingName;

            // On ne conserve que les args déclarés par la source (schéma PHP)
            // et effectivement renseignés.
            const args = {};
            if (currentSourceArgs && currentSourceArgs.length > 0) {
                currentSourceArgs.forEach((field) => {
                    const raw = bindingArgs[field.key];
                    if (field.type === 'number') {
                        const num = parseInt(raw, 10);
                        if (!isNaN(num)) args[field.key] = num;
                    } else if (typeof raw === 'string' && raw.trim() !== '') {
                        args[field.key] = raw;
                    }
                });
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
            setBindingArgs({});
        };

        const toggleContentLock = (enabled) => {
            setContentLockEnabled(enabled);
            if (enabled) {
                setAttributes({ templateLock: 'contentOnly' });
            } else {
                setAttributes({ templateLock: undefined });
            }
        };

        const isFormValid = () => {
            if (!bindingName) return false;
            if (currentSourceArgs && currentSourceArgs.length > 0) {
                // Tous les champs texte doivent être renseignés.
                return currentSourceArgs.every((field) => {
                    const val = bindingArgs[field.key];
                    return typeof val === 'string' && val.trim() !== '';
                });
            }
            return true;
        };

        // Génère un texte lorem ipsum du nombre de mots demandé (placeholder)
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

        // Génère l'URL de preview pour Lorem Picsum (source spécifique)
        const getPicsumUrl = () => {
            if (bindingSource !== 'up/lorem-picsum') return null;
            const width  = bindingArgs.width || 1200;
            const height = bindingArgs.height || 700;
            const id     = bindingArgs.id ? `/id/${bindingArgs.id}` : '';
            return `https://picsum.photos${id}/${width}/${height}`;
        };

        return (
            <>
                <BlockEdit {...props} />
                <InspectorControls>
                    {CONTENT_LOCK_SUPPORTED.has(props.name) && (
                        <PanelBody title={__('Verrouillage', 'up-gutenberg-bindings-interface')} initialOpen={false}>
                            <ToggleControl
                                __nextHasNoMarginBottom
                                label={__('Verrouiller le contenu uniquement', 'up-gutenberg-bindings-interface')}
                                checked={contentLockEnabled}
                                onChange={toggleContentLock}
                                help={__('Empêche la suppression ou le déplacement du bloc, mais permet la modification de son contenu.', 'up-gutenberg-bindings-interface')}
                            />
                        </PanelBody>
                    )}
                    <PanelBody title={__('Configuration des Bindings', 'up-gutenberg-bindings-interface')}>
                        {PLACEHOLDER_SUPPORTED.has(props.name) && (
                            <>
                                <TextControl
                                    __nextHasNoMarginBottom
                                    __next40pxDefaultSize
                                    label={__('Placeholder natif', 'up-gutenberg-bindings-interface')}
                                    value={attributes.placeholder || ''}
                                    onChange={(val) => {
                                        const next = typeof val === 'string' ? val : '';
                                        if (next.trim() === '') {
                                            setAttributes({ placeholder: undefined });
                                        } else {
                                            setAttributes({ placeholder: next });
                                        }
                                    }}
                                    help={__('S\'affiche dans l\'éditeur lorsque le contenu est vide (aucun autre méta ajouté).', 'up-gutenberg-bindings-interface')}
                                />

                                <SelectControl
                                    __nextHasNoMarginBottom
                                    __next40pxDefaultSize
                                    label={__('Générer un Lorem ipsum', 'up-gutenberg-bindings-interface')}
                                    value={loremSelect}
                                    options={[
                                        { label: __('— Choisir —', 'up-gutenberg-bindings-interface'), value: '' },
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
                                    help={__('Sélectionner un nombre de mots pour remplir le placeholder avec du Lorem ipsum. La sélection n\'est pas sauvegardée.', 'up-gutenberg-bindings-interface')}
                                />
                            </>
                        )}

                        <p>Liez ce bloc à une source de données dynamique.</p>

                        <SelectControl
                            __nextHasNoMarginBottom
                            __next40pxDefaultSize
                            label={__('Source des données', 'up-gutenberg-bindings-interface')}
                            value={bindingSource}
                            options={bindingSources}
                            onChange={(src) => {
                                setBindingSource(src);
                                setBindingArgs({});
                            }}
                        />

                        <TextControl
                            __nextHasNoMarginBottom
                            __next40pxDefaultSize
                            label={__('Nom du block', 'up-gutenberg-bindings-interface')}
                            value={bindingName}
                            onChange={setBindingName}
                            help={__("Ex: 'Intro', 'Titre de l'article'", 'up-gutenberg-bindings-interface')}
                        />

                        {/* Champs de configuration génériques déclarés côté PHP */}
                        {currentSourceArgs && currentSourceArgs.length > 0 && currentSourceArgs.map((field) => (
                            <TextControl
                                key={field.key}
                                __nextHasNoMarginBottom
                                __next40pxDefaultSize
                                label={field.label}
                                type={field.type === 'number' ? 'number' : 'text'}
                                value={bindingArgs[field.key] ?? ''}
                                onChange={(val) =>
                                    setBindingArgs((prev) => ({
                                        ...prev,
                                        [field.key]: val,
                                    }))
                                }
                            />
                        ))}

                        {/* Aperçu spécifique à Lorem Picsum */}
                        {bindingSource === 'up/lorem-picsum' && getPicsumUrl() && (
                            <div style={{ marginTop: '15px' }}>
                                <strong>{__('Prévisualisation :', 'up-gutenberg-bindings-interface')}</strong>
                                <img
                                    src={getPicsumUrl()}
                                    alt="Preview Picsum"
                                    style={{ maxWidth: '100%', borderRadius: '4px', marginTop: '8px' }}
                                />
                            </div>
                        )}

                        <Button isPrimary onClick={applyBinding} disabled={!isFormValid()}>
                            {__('Appliquer le Binding', 'up-gutenberg-bindings-interface')}
                        </Button>

                        {metadata && metadata.bindings && (
                            <Button isLink isDestructive onClick={removeBinding} style={{ marginTop: '10px' }}>
                                {__('Supprimer le Binding', 'up-gutenberg-bindings-interface')}
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
                                <strong>{__('Binding actuel:', 'up-gutenberg-bindings-interface')}</strong>
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
