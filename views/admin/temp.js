
// const editOfferForms = document.querySelectorAll('.edit-offer-form');

// editOfferForms.forEach(form => {
//     form.addEventListener('submit', function (event) {
//         event.preventDefault();
//         const offerId = this.getAttribute('data-offer-id');

//         const offerTitle = document.getElementById(`offerTitle${offerId}`);
//         const offerDetails = document.getElementById(`offerDetails${offerId}`);
//         const offerDiscount = document.getElementById(`offerDiscount${offerId}`);
//         const productSelect = document.getElementById(`productSelect${offerId}`);
//         const offerStatus = document.getElementById(`offerStatus${offerId}`);
//         const edit_hidden = document.getElementById(`edit-hiddenid${offerId}`);



//         editOfferForm(
//             offerTitle, offerDetails, offerDiscount,
//             productSelect, offerStatus, edit_hidden
//         );
//     });
// });


// const editOfferForm = async (
//     offerTitle, offerDetails, offerDiscount,
//     productSelect, offerStatus, edit_hidden
// ) => {

//     const edit_titleValue = offerTitle.value.trim();
//     const edit_detailsValue = offerDetails.value.trim();
//     const edit_discountValue = offerDiscount.value.trim();
//     const edit_selectValue = productSelect.value.trim();
//     const edit_statusValue = offerStatus.value;
//     const edit_hiddenValue = edit_hidden.value.trim();



//     let isValid = true;
//     const nameRegex = /[a-zA-Z0-9]+$/;

    
//     if (edit_titleValue === '') {
//         isValid = false;
//         setError(offerTitle, 'Enter Title');
//     }else if (!nameRegex.test(edit_titleValue)) {
//         setError(offerTitle, 'Offer Name should only contain letters and numbers');
//          isValid = false;
//     } else if (edit_titleValue.length < 3) {
//         isValid = false;
//         setError(offerTitle, 'Title should be more than 2 letters');
//     } else {
//         setSuccess(offerTitle, 'Name');
//     }
//     if (edit_detailsValue === '') {
//         isValid = false;
//         setError(offerDetails, 'Enter Description');
//     } else if (edit_detailsValue.length < 3) {
//         isValid = false;
//         setError(offerDetails, 'Description should be more than 2 letters');
//     } else {
//         setSuccess(offerDetails, 'Description');
//     }
//     if (edit_discountValue === '') {
//         isValid = false;
//         setError(offerDiscount, 'Enter Discount Amount');
//     } else if (edit_discountValue < 0) {
//         isValid = false;
//         setError(offerDiscount, 'Discount shuold be more than 0 ');
//     } else if (edit_discountValue > 90) {
//         isValid = false;
//         setError(offerDiscount, 'Discount shuold be less than 90 ');
//     } else {
//         setSuccess(offerDiscount, 'Discount');
//     }
//     if (edit_selectValue.length === 0) {
//         isValid = false;
//         setError(productSelect, 'Please select at least one product');
//     } else {
//         setSuccess(productSelect, 'Products');
//     }
//     if (!edit_statusValue) {
//         isValid = false;
//         setError(offerStatus, 'Select Status');
//     } else {
//         setSuccess(offerStatus, 'Status');
//     }
//     if (!isValid) {
//         return;
//     } try {
//         const response = await fetch('/admin/updateOffer', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 title: edit_titleValue,
//                 description: edit_detailsValue,
//                 discount: edit_discountValue,
//                 products: Array.from(productSelect.selectedOptions).map(option => option.value),
//                 status: edit_statusValue,
//                 type: 'PRODUCT',
//                 id: edit_hiddenValue
//             })
//         });
//         const data = await response.json();
//         if (data.success) {
//             Swal.fire({
//                 title: 'Success!',
//                 text: data.message,
//                 icon: 'success',
//                 confirmButtonText: 'OK'
//             }).then((result) => {
//                 if (result.isConfirmed) {
//                     window.location.href = data.redirectUrl;
//                 }
//             });
//             $('.editmodel').modal('hide');
//         } else {
//             Swal.fire({
//                 title: 'Error!',
//                 text: data.message,
//                 icon: 'error',
//                 confirmButtonText: 'OK'
//             });
//         }
//     } catch (error) {
//         console.error('Error during address update:', error);
//     }
// }


// async function deleteOffer(offerId) {

//     const result = await Swal.fire({
//         title: 'Are you sure?',
//         text: "You won't be able to revert this!",
//         icon: 'warning',
//         showCancelButton: true,
//         confirmButtonColor: '#3085d6',
//         cancelButtonColor: '#d33',
//         confirmButtonText: 'Yes, delete it!'
//     });

//     if (result.isConfirmed) {
//         try {
//             const response = await fetch('/admin/deleteOffer', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({ id: offerId })
//             });

//             const data = await response.json();

//             if (data.success) {
//                 Swal.fire(
//                     'Deleted!',
//                     'Your Offer has been deleted.',
//                     'success'
//                 ).then(() => {

//                     location.reload();
//                 });
//             } else {
//                 Swal.fire(
//                     'Error!',
//                     data.message,
//                     'error'
//                 );
//             }
//         } catch (error) {
//             console.error('Error during Offer deletion:', error);
//             Swal.fire(
//                 'Error!',
//                 'An error occurred while deleting the Offer.',
//                 'error'
//             );
//         }
//     }
// }



<div class="form-group">
            <label>Multiple select using select 2</label>
            <select class="js-example-basic-multiple select2-hidden-accessible" multiple="" style="width:100%" data-select2-id="4" tabindex="-1" aria-hidden="true">
            <option value="AL" data-select2-id="10">Alabama</option>
            <option value="WY" data-select2-id="11">Wyoming</option>
            <option value="AM" data-select2-id="12">America</option>
            <option value="CA" data-select2-id="13">Canada</option>
            <option value="RU" data-select2-id="14">Russia</option>
         </select><span class="select2 select2-container select2-container--default select2-container--above" dir="ltr" data-select2-id="5" style="width: 100%;"><span class="selection"><span class="select2-selection select2-selection--multiple" role="combobox" aria-haspopup="true" aria-expanded="false" tabindex="-1" aria-disabled="false"><ul class="select2-selection__rendered"><li class="select2-selection__choice" title="America" data-select2-id="17"><span class="select2-selection__choice__remove" role="presentation">×</span>America</li><li class="select2-selection__choice" title="Canada" data-select2-id="18"><span class="select2-selection__choice__remove" role="presentation">×</span>Canada</li><li class="select2-search select2-search--inline"><input class="select2-search__field" type="search" tabindex="0" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" role="searchbox" aria-autocomplete="list" placeholder="" style="width: 0.75em;"></li></ul></span></span><span class="dropdown-wrapper" aria-hidden="true"></span></span>
 </div>