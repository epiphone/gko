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
    /// Interaction logic for PointsTextBox.xaml
    /// </summary>
    public partial class PointsTextBox : UserControl
    {
        public static readonly DependencyProperty PointsProperty = DependencyProperty.Register(
            "Points", typeof(int), typeof(PointsTextBox));

        public int Points
        {
            get { return (int)GetValue(PointsProperty); }
            set { SetValue(PointsProperty, value); }
        }

        public PointsTextBox()
        {
            InitializeComponent();
        }
    }

    /// <summary>
    /// Validoi pistemäärän. Kelpuuttaa kenttään kokonaisluvun väliltä -1500 - 5000.
    /// </summary>
    class PointsValidationRule : ValidationRule
    {
        public override ValidationResult Validate(object val, CultureInfo cultureInfo)
        {
            int points;
            if (!int.TryParse(val.ToString(), out points))
                return new ValidationResult(false, "Failed to parse an integer");

            if (points < -1500 || points > 5000)
                return new ValidationResult(false, "Value not in range ]-1500, 5000[");

            return ValidationResult.ValidResult;
        }
    }
}
