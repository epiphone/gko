using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace VT4
{
    /// <summary>
    /// Interaction logic for NameTextBox.xaml
    /// </summary>
    public partial class NameTextBox : UserControl
    {
        public static readonly DependencyProperty NameTextProperty = DependencyProperty.Register(
            "NameText", typeof(string), typeof(NameTextBox));

        public string NameText
        {
            get { return (string)GetValue(NameTextProperty); }
            set { SetValue(NameTextProperty, value); }
        }

        public NameTextBox()
        {
            InitializeComponent();
        }
    }

    /// <summary>
    /// Validoi pelaajien nimet. Kenttiin kelpuutetaan vain merkkejä eli
    /// ei numeroita eikä erikoismerkkejä.
    /// </summary>
    class NameValidationRule : ValidationRule
    {
        public override ValidationResult Validate(object val, CultureInfo cultureInfo)
        {
            string text;
            try
            {
                text = (string)val;
            }
            catch (Exception)
            {
                return new ValidationResult(false, "Value is not a string");
            }

            if (text.Any(c => !Char.IsLetter(c)))
            {
                return new ValidationResult(false, "Contains invalid characters");
            }

            return ValidationResult.ValidResult;
        }
    }
}
