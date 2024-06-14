import { LightningElement, track, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import jsPDF from '@salesforce/resourceUrl/jsPDF';
import fetchAllFieldList from '@salesforce/apex/CreatePdfsController.fetchAllFieldList';
import fetchAllObjectList from '@salesforce/apex/CreatePdfsController.fetchAllObjectList';
import processArray from '@salesforce/apex/CreatePdfsController.processArray';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class CreatePdfs extends LightningElement {

    strFile;
    @track allObjectList = [];
    @track objectList= [];
    @track customObjectList = [];
    @track standardObjectList = [];
    @track fieldList = [];
    objectName = '';
    @api objectApiName;
    @api selectedFields=[];
    @api recordId;
    arrayValue;
    recordData;
    selectedFieldsList = [];
    
    arrayValue = [];

    
    @track objectTypeList =  [

        
        { label: "All", value: 'All' },
        { label: "Custom", value: 'Custom' },
        { label: "Standard", value: 'Standard' }
    
];


    renderedCallback() {
        loadScript(this, jsPDF)
            .then(() => {
                console.log('jsPDF loaded again');
                 this.initializePdfjsLib();
            })
            .catch((error) => {
                // console.error('Error loading pdfjs libraries:', error);
            });
    }
    initializePdfjsLib() {
        console.log('insideinitializePdfjsLib');
        if (typeof globalThis === 'undefined') {
            if (typeof window !== 'undefined') {
                window.globalThis = window;
            } else if (typeof global !== 'undefined') {
                global.globalThis = global;
            } else if (typeof self !== 'undefined') {
                self.globalThis = self;
            }
            
        }
    }


    connectedCallback(){

        


        fetchAllObjectList()
         .then((result) => {
            if(result){

                for(let key in result){
                    if(key.endsWith('__c')){
                        this.customObjectList.push({ label: key, value:key });
                    } else if(!key.endsWith('__c')){
                        this.standardObjectList.push({ label: key, value:key });
                    }
                    this.allObjectList.push({ label: key, value:key }); 

                }

            } else {
                // console.log('objects not found');
            }
        }).catch((error) => {
            this.showToast('Error', 'Objects not found' + error.message, 'error');
            // console.log('objects not found',error);
        }); 

    
    }

    

    onObjectTypeChange(event){
        this.objectList = []; // Clear the list
        // this.fieldList=[];
        if (event.detail.value == 'All') {
            this.objectList = this.allObjectList;
        } else if (event.detail.value == 'Custom') {
            if (this.customObjectList.length === 0) {
                this.showToast('Error', 'No custom objects available', 'error');
                
                return ;
                
            }
            this.objectList = this.customObjectList;
        } else if (event.detail.value == 'Standard') {
            this.objectList = this.standardObjectList;
        }
    }
 
    onObjectChange(event){
        this.objectName = event.detail.value;
        this.fieldList = [];
        this.objectApiName = event.target.value;
        // console.log('objectApiName===',this.objectApiName);

        fetchAllFieldList({ strObjectName : this.objectName})
        .then(result => {

            // Check if fields are empty
            if (Object.keys(result).length === 0) {
                this.showToast('Warning', 'No fields available for this object', 'warning');
                return;
            }

            for(let key in result){
                this.fieldList.push({label: key, value: key});
            }
        })
        .catch(error => {
            this.showToast('Error', 'Error in getting fields' + error.message, 'Error');
            // console.log('Error in getting fields',error);
        })
    }


    handleCheckboxChange(event) {

            
        const selectedFields = event.target.value;


        // console.log('selectedFields=====',this.selectedFields);
       // this.selectedFields = [];
        this.arrayValue = selectedFields;

        // console.log('arrayValue==========',this.arrayValue);
       

    }

    handleRecordIdChange(event) {
        this.recordId = event.target.value;
        
    }



    getData() {

        

        processArray({
            stringArray: this.arrayValue,
            objectApiName: this.objectApiName,
            recordId: this.recordId
        })
        .then(recordData => {
            // console.log('recordData=====>' + recordData);

            if(this.recordId){
            this.generatePdf(recordData);
            }
        })
        .catch(error => {
            // console.log('error', error);
            
        });
    }
    
    generatePdf(recordData) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
    
        // Add a header to the PDF with the object name
        doc.setFontSize(16);
        doc.text(this.objectName + ': ' + this.recordId, 20, 15); // Customize the header text and position
    
        // Add a line separator between header and record data
        doc.line(20, 20, 190, 20);
    
        // Add the record data to the PDF
        doc.setFontSize(12);
    
        // Split the recordData into lines using '\n' as the delimiter
        const lines = doc.splitTextToSize(recordData, 150); // Adjust width as needed
    
        // Set initial vertical position for record data
        let yPos = 30;
    
        // Loop through lines and add them to the PDF
        lines.forEach(line => {
            const lineHeight = doc.getTextDimensions(line).h;
            if (yPos + lineHeight > 280) { // Adjust the height limit based on your preference
                doc.addPage(); // Start a new page if current page is full
                yPos = 20; // Reset yPos for the new page
            }
            doc.text(line, 20, yPos, { align: 'left' });
            yPos += lineHeight + 2; // Add 2 for extra spacing between lines
        });
    
        
            // Save the PDF with the desired file name format
            const fileName = `${this.objectName}: ${this.recordId}.pdf`;
            doc.save(fileName);
    
            // Show success toast message
            this.showToast('Success', 'PDF document created successfully', 'success');
        
    }
    
    showToast(title, message, variant){
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }
}