using System;
using System.Collections.Generic;
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

namespace VT6
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            panel.AddHandler(EventLabel.MyDropEvent, new EventLabel.DropEventHandler(OnDropEvent));
        }

        /// <summary>
        /// Käsittelee RoutedEventin, joka laukaistaan EventLabelista.
        /// </summary>
        public void OnDropEvent(object sender, DropEventArgs e)
        {
            var src = (EventLabel)e.Source;
            
            try
            {
                src.Content = int.Parse(src.Content.ToString()) + e.Addition;
            }
            catch (FormatException)
            {
                src.Content = e.Addition;
            }
            
            e.Handled = true;
        }

        /// <summary>
        /// Aloittaa dragin.
        /// </summary>
        private void Label_MouseMove(object sender, MouseEventArgs e)
        {
            if (e.LeftButton == MouseButtonState.Pressed)
            {
                var label = (Label)sender;
                int addition;
                int.TryParse(label.Content.ToString(), out addition);

                DataObject data = new DataObject(typeof(int), addition);
                DragDrop.DoDragDrop(this, data, DragDropEffects.Move);   
            }
        }
    }
}
