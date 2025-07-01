// BY OXSR github
import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';

export class TextSplitterChunker implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Text Splitter & Chunker',
        name: 'textSplitterChunker',
        icon: 'fa:cut', 
        group: ['transform'],
        version: 2,
        description: 'Splits or extracts text using length, paragraph, sentence, word, or regex.',
        defaults: {
            name: 'Text Splitter & Chunker',
        },
        inputs: ['main'],
        outputs: ['main'],
        properties: [
            {
                displayName: 'Text Field',
                name: 'textField',
                type: 'string',
                default: 'text',
                description: 'Name of the field in input item that contains the text to process.',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                options: [
                    { name: 'Split', value: 'split', description: 'Divide text (default)' },
                    { name: 'Extract', value: 'extract', description: 'Extract matches (regex only)' },
                ],
                default: 'split',
            },
            {
                displayName: 'Split Method',
                name: 'splitMethod',
                type: 'options',
                options: [
                    { name: 'Length', value: 'length' },
                    { name: 'Paragraph', value: 'paragraph' },
                    { name: 'Sentence', value: 'sentence' },
                    { name: 'Word', value: 'word' },
                    { name: 'Regex', value: 'regex' },
                ],
                default: 'length',
                displayOptions: {
                    show: {
                        operation: ['split'],
                    },
                },
                description: 'Method to split the text.',
            },
            {
                displayName: 'Regex Pattern',
                name: 'regex',
                type: 'string',
                default: '[aeiouáéíóúüAEIOUÁÉÍÓÚÜ]',
                displayOptions: {
                    show: {
                        operation: ['extract'],
                    },
                },
                description: 'Regular expression to extract from the text.',
            },
            {
                displayName: 'Length (characters)',
                name: 'length',
                type: 'number',
                default: 100,
                displayOptions: {
                    show: {
                        operation: ['split'],
                        splitMethod: ['length'],
                    },
                },
                description: 'Number of characters per chunk.',
            },
            {
                displayName: 'Regex Pattern (for split)',
                name: 'splitRegex',
                type: 'string',
                default: '\\n\\n+',
                displayOptions: {
                    show: {
                        operation: ['split'],
                        splitMethod: ['regex'],
                    },
                },
                description: 'Regular expression to split the text.',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            const textField = this.getNodeParameter('textField', i) as string;
            const operation = this.getNodeParameter('operation', i) as string;
            const text = items[i].json[textField] as string;

            if (!text) {
                continue;
            }

            if (operation === 'extract') {
                const pattern = this.getNodeParameter('regex', i) as string;
                const matches = text.match(new RegExp(pattern, 'gi')) || [];
                for (const match of matches) {
                    returnData.push({
                        json: {
                            ...items[i].json,
                            match,
                        },
                    });
                }
            } else { // Split
                const splitMethod = this.getNodeParameter('splitMethod', i) as string;
                let chunks: string[] = [];
                switch (splitMethod) {
                    case 'length': {
                        const length = this.getNodeParameter('length', i) as number;
                        for (let pos = 0; pos < text.length; pos += length) {
                            chunks.push(text.slice(pos, pos + length));
                        }
                        break;
                    }
                    case 'paragraph':
                        chunks = text.split(/\n\s*\n/);
                        break;
                    case 'sentence':
                        chunks = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
                        break;
                    case 'word':
                        chunks = text.split(/\s+/);
                        break;
                    case 'regex': {
                        const pattern = this.getNodeParameter('splitRegex', i) as string;
                        chunks = text.split(new RegExp(pattern, 'g'));
                        break;
                    }
                    default:
                        chunks = [text];
                }
                for (const chunk of chunks) {
                    if (chunk !== '') {
                        returnData.push({
                            json: {
                                ...items[i].json,
                                chunk,
                            },
                        });
                    }
                }
            }
        }
        return [returnData];
    }
}
