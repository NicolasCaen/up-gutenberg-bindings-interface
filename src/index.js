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

const META_FIELDS = {
    'core/image': [
        { key: 'url', label: 'Meta URL' },
        { key: 'alt', label: 'Meta Texte alternatif' },
        { key: 'title', label: 'Meta Titre' },
    ],
    'core/button': [
        { key: 'url', label: 'Meta URL' },
        { key: 'text', label: 'Meta Texte' },
    ],
    'core/paragraph': [
        { key: 'content', label: 'Meta Contenu' },
    ],
    'core/heading': [
        { key: 'content', label: 'Meta Contenu' },
    ],
};

const BLOCK_BINDING_ATTRIBUTES = {
    'core/paragraph': 'content',
    'core/heading':   'content',
    'core/button':    'text',
    'core/image':     'url',
};

const withBindingControls = createHigherOrderComponent((BlockEdit) => {
    return (props) => {
        if (!ALLOWED_BLOCKS.includes(props.name)) return <BlockEdit {...props} />;

        const { attributes, setAttributes } = props;
        const { metadata } = attributes;

        const [bindingName, setBindingName] = useState('');
        const [bindingSource, setBindingSource] = useState('core/pattern-overrides');
        const [bindingKey, setBindingKey] = useState({});
        const [wordCount, setWordCount] = useState(8);

        useEffect(() => {
            if (metadata?.name) setBindingName(metadata.name);

            const attr    = BLOCK_BINDING_ATTRIBUTES[props.name];
            const binding = metadata?.bindings?.[attr] || metadata?.bindings?.__default;

            if (binding?.source) setBindingSource(binding.source);

            if (binding?.source === 'core/post-meta') {
                setBindingKey(binding.args || {});
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
                Object.assign(args, bindingKey);
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
                return Object.values(bindingKey).some((val) => val && val !== '');
            }
            return true;
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
                            label={__('Nom de la métadonnée (Name)', 'mon-plugin-bindings')}
                            value={bindingName}
                            onChange={setBindingName}
                            help={__("Ex: 'Intro', 'Titre de l'article'", 'mon-plugin-bindings')}
                        />

                        {bindingSource === 'core/post-meta' &&
                            (META_FIELDS[props.name] || []).map((field) => (
                                <TextControl
                                    key={field.key}
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
