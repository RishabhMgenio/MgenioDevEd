public class UploadPdfController {


    public PageReference navigateToTab() {
        
        return new PageReference('/lightning/n/Mgenio__Extract_Text');
    }
    
     public PageReference navigateToFunctionalityTwo(){
        
        return new PageReference('/lightning/n/Mgenio__PDF_Extractor_Component');	
    }
    
    
    public PageReference navigateToFunctionalityThree(){
        
        return new PageReference('/lightning/n/Mgenio__Export_PDF');	
    }
    
       
    
    	public PageReference navigateToFunctionalityFour(){
        
        return new PageReference('/lightning/n/Mgenio__PDF_Generator_Component');	
    }
    
}