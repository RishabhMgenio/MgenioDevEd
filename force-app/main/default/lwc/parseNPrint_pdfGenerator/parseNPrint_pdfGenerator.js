import { LightningElement, track, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import jsPDF from '@salesforce/resourceUrl/jsPDF';
import fetchAllFieldListforRecordPage from '@salesforce/apex/CreatePdfsController.fetchAllFieldListforRecordPage';
import PNPLogo from '@salesforce/resourceUrl/PNPLogo';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import processArray from '@salesforce/apex/CreatePdfsController.processArray';


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
    logoUrl = PNPLogo;
    @track showFieldList = false;

    
    @track objectTypeList =  [

        
        { label: "All", value: 'All' },
        { label: "Custom", value: 'Custom' },
        { label: "Standard", value: 'Standard' }
    
];


    renderedCallback() {
        loadScript(this, jsPDF)
            .then(() => {
                // console.log('jsPDF loaded again');
                 this.initializePdfjsLib();
            })
            .catch((error) => {
                // console.error('Error loading pdfjs libraries:', error);
            });
    }

    initializePdfjsLib() {
        // console.log('insideinitializePdfjsLib');
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

    get buttonLabel() {
        return this.showFieldList ? 'Hide Field List' : 'Get Field List';
    }

    toggleFieldList(event) {
        this.showFieldList = !this.showFieldList;
        // console.log('insideToggleFielddddd=========', this.showFieldList);
        if (this.showFieldList) {
            // console.log('iffffffinsideToggleField=========', this.showFieldList);
            // Call the onObjectChange function here
            // Assuming you have access to the event or you need to create one
            // Replace eventValue with the appropriate value for event.detail.value
        //    const event = { detail: { value: objectName } };
        //    console.log('detail========',detail);
            this.onObjectChange(event);
            // console.log('onObjectChangeCalled=====',onObjectChange);
    }
}
   

    onObjectChange(event){


       
        this.objectName = event.detail.value;
        const fieldList = event.target.value;
        // console.log('fieldList=======', fieldList);
        this.fieldList = [];
       
        // console.log('objectApiName===',this.objectApiName);

         fetchAllFieldListforRecordPage({ strObjectName : this.objectApiName})
             .then(result => {
                if (result.length === 0) {
                    this.showToast('Warning', 'No fields available for this object', 'warning');
                    return;
                }
                for(let key in result){
                this.fieldList.push({label: key, value: key});
            }
        })
        .catch(error => {
            this.showToast('Error', 'Error fetching fields.', 'error');
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
            this.generatePdf(recordData);
        })
       
        .catch(error => {
            // console.log('error', error);
        });
    }

    

    generatePdf(recordData, objectName) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        this.objectName= this.objectApiName;
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